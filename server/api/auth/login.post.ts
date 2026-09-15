import {
  clearLoginFailures,
  enforceLoginRateLimit,
  normalizeEmail,
  recordLoginFailure,
  setSessionCookie,
  verifyCredentials,
} from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody<Record<string, unknown> | null>(event)
  const email = typeof body?.email === 'string' ? body.email.trim() : ''
  const password = typeof body?.password === 'string' ? body.password : ''

  if (!email || !password || email.length > 254 || password.length > 128) {
    throw createError({ statusCode: 400, statusMessage: '請輸入帳號與密碼' })
  }

  enforceLoginRateLimit(event)
  if (!verifyCredentials(email, password)) {
    recordLoginFailure(event)
    throw createError({ statusCode: 401, statusMessage: '登入資訊不正確' })
  }

  clearLoginFailures(event)
  setSessionCookie(event)
  return { user: { email: normalizeEmail(email) } }
})
