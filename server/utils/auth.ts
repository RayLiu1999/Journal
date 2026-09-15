import { createHmac, timingSafeEqual } from 'node:crypto'
import type { H3Event } from 'h3'
import {
  createError,
  deleteCookie,
  getCookie,
  getHeader,
  getRequestURL,
  setCookie,
  setHeader,
} from 'h3'

const AUTH_COOKIE = 'paper_journal_session'
const SESSION_TTL = 60 * 60 * 24 * 30
const LOGIN_WINDOW_MS = 15 * 60 * 1000
const MAX_FAILED_LOGINS = 5

type AuthConfig = {
  email: string
  password: string
  secret: string
}

type SessionPayload = {
  email: string
  exp: number
  version: string
}

type LoginAttempt = {
  count: number
  resetAt: number
}

const loginAttempts = new Map<string, LoginAttempt>()

export type AuthUser = { email: string }

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase()
}

function getAuthConfig(): AuthConfig {
  const auth = useRuntimeConfig().auth as Partial<AuthConfig> | undefined
  const email = typeof auth?.email === 'string' ? normalizeEmail(auth.email) : ''
  const password = typeof auth?.password === 'string' ? auth.password : ''
  const secret = typeof auth?.secret === 'string' ? auth.secret : ''

  if (!email.includes('@') || !password || secret.length < 32) {
    throw createError({
      statusCode: 503,
      statusMessage: '伺服器尚未設定完整的登入資訊',
    })
  }

  return { email, password, secret }
}

function digest(value: string, secret: string, label: string) {
  return createHmac('sha256', secret).update(`${label}:${value}`).digest()
}

function matches(value: string, expected: string, config: AuthConfig, label: string) {
  return timingSafeEqual(digest(value, config.secret, label), digest(expected, config.secret, label))
}

function authVersion(config: AuthConfig) {
  return digest(config.password, config.secret, 'auth-version').toString('base64url')
}

function sign(value: string, secret: string) {
  return createHmac('sha256', secret).update(value).digest('base64url')
}

function encodePayload(payload: SessionPayload) {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')
}

function createSessionToken(config: AuthConfig) {
  const payload: SessionPayload = {
    email: config.email,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL,
    version: authVersion(config),
  }
  const encodedPayload = encodePayload(payload)
  return `${encodedPayload}.${sign(encodedPayload, config.secret)}`
}

function isSecureRequest(event: H3Event) {
  const forwardedProtocol = getHeader(event, 'x-forwarded-proto')?.split(',')[0]?.trim().toLowerCase()
  if (forwardedProtocol) return forwardedProtocol === 'https'
  return getRequestURL(event).protocol === 'https:'
}

export function verifyCredentials(email: string, password: string) {
  const config = getAuthConfig()
  const emailMatches = matches(normalizeEmail(email), config.email, config, 'email')
  const passwordMatches = matches(password, config.password, config, 'password')
  return emailMatches && passwordMatches
}

export function setSessionCookie(event: H3Event) {
  const config = getAuthConfig()
  setCookie(event, AUTH_COOKIE, createSessionToken(config), {
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecureRequest(event),
    path: '/',
    maxAge: SESSION_TTL,
  })
}

export function clearSessionCookie(event: H3Event) {
  deleteCookie(event, AUTH_COOKIE, {
    sameSite: 'lax',
    secure: isSecureRequest(event),
    path: '/',
  })
}

function verifySessionToken(token: string, config: AuthConfig): AuthUser | null {
  const [encodedPayload, signature, ...extraParts] = token.split('.')
  if (!encodedPayload || !signature || extraParts.length > 0) return null

  const expectedSignature = sign(encodedPayload, config.secret)
  const actualSignature = Buffer.from(signature)
  const expectedSignatureBuffer = Buffer.from(expectedSignature)
  if (
    actualSignature.length !== expectedSignatureBuffer.length
    || !timingSafeEqual(actualSignature, expectedSignatureBuffer)
  ) {
    return null
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as Partial<SessionPayload>
    const now = Math.floor(Date.now() / 1000)
    if (
      typeof payload.email !== 'string'
      || typeof payload.exp !== 'number'
      || typeof payload.version !== 'string'
      || payload.exp <= now
      || payload.version !== authVersion(config)
      || !matches(payload.email, config.email, config, 'email')
    ) {
      return null
    }
    return { email: config.email }
  } catch {
    return null
  }
}

export function getSessionUser(event: H3Event): AuthUser | null {
  const config = getAuthConfig()
  const token = getCookie(event, AUTH_COOKIE)
  if (!token) return null
  return verifySessionToken(token, config)
}

export function requireUser(event: H3Event) {
  const user = getSessionUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: '需要登入' })
  }
  return user
}

function getClientKey(event: H3Event) {
  const cloudflareIp = getHeader(event, 'cf-connecting-ip')?.trim()
  if (cloudflareIp) return cloudflareIp

  const forwardedIp = getHeader(event, 'x-forwarded-for')?.split(',')[0]?.trim()
  if (forwardedIp) return forwardedIp

  return event.node.req.socket.remoteAddress ?? 'unknown'
}

export function enforceLoginRateLimit(event: H3Event) {
  const key = getClientKey(event)
  const attempt = loginAttempts.get(key)
  if (!attempt) return

  if (attempt.resetAt <= Date.now()) {
    loginAttempts.delete(key)
    return
  }

  if (attempt.count >= MAX_FAILED_LOGINS) {
    setHeader(event, 'retry-after', Math.ceil((attempt.resetAt - Date.now()) / 1000))
    throw createError({ statusCode: 429, statusMessage: '登入嘗試次數過多，請稍後再試' })
  }
}

export function recordLoginFailure(event: H3Event) {
  const key = getClientKey(event)
  const now = Date.now()
  const attempt = loginAttempts.get(key)
  if (!attempt || attempt.resetAt <= now) {
    loginAttempts.set(key, { count: 1, resetAt: now + LOGIN_WINDOW_MS })
    return
  }
  attempt.count += 1
}

export function clearLoginFailures(event: H3Event) {
  loginAttempts.delete(getClientKey(event))
}
