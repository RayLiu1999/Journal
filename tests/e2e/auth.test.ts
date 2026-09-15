import { describe, expect, it } from 'vitest'
import { fetch, setup } from '@nuxt/test-utils/e2e'

const authEmail = 'test@example.com'
const authPassword = 'test-password'
const authSecret = 'test-secret-that-is-long-enough-for-authentication'

describe('authentication', async () => {
  await setup({
    env: {
      NUXT_AUTH_EMAIL: authEmail,
      NUXT_AUTH_PASSWORD: authPassword,
      NUXT_AUTH_SECRET: authSecret,
    },
  })

  it('protects pages and APIs before login', async () => {
    const page = await fetch('/', { redirect: 'manual' })
    expect([301, 302, 307, 308]).toContain(page.status)
    expect(page.headers.get('location')).toContain('/login')

    const api = await fetch('/api/entries?month=2026-09')
    expect(api.status).toBe(401)
  })

  it('creates a session and supports logout', async () => {
    const login = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: authEmail, password: authPassword }),
    })
    expect(login.status).toBe(200)
    expect(await login.json()).toEqual({ user: { email: authEmail } })

    const sessionCookie = login.headers.get('set-cookie')?.split(';', 1)[0] ?? ''
    expect(sessionCookie).not.toBe('')

    const session = await fetch('/api/auth/session', { headers: { cookie: sessionCookie } })
    expect(session.status).toBe(200)
    expect(await session.json()).toEqual({ user: { email: authEmail } })

    const logout = await fetch('/api/auth/logout', { method: 'POST', headers: { cookie: sessionCookie } })
    expect(logout.status).toBe(200)
    const afterLogout = await fetch('/api/auth/session')
    expect(afterLogout.status).toBe(401)
  })
})
