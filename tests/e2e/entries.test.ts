import { beforeAll, describe, expect, it } from 'vitest'
import { $fetch, fetch, setup } from '@nuxt/test-utils/e2e'

const databaseUrl = process.env.DATABASE_URL_TEST
const authEmail = 'test@example.com'
const authPassword = 'test-password'
const authSecret = 'test-secret-that-is-long-enough-for-authentication'

describe.skipIf(!databaseUrl)('entries API', async () => {
  await setup({
    env: {
      NUXT_DATABASE_URL: databaseUrl!,
      NUXT_AUTH_EMAIL: authEmail,
      NUXT_AUTH_PASSWORD: authPassword,
      NUXT_AUTH_SECRET: authSecret,
    },
  })

  const date = '2026-09-11'
  let sessionCookie = ''
  const authHeaders = () => ({ cookie: sessionCookie })

  beforeAll(async () => {
    const login = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: authEmail, password: authPassword }),
    })
    expect(login.status).toBe(200)
    sessionCookie = login.headers.get('set-cookie')?.split(';', 1)[0] ?? ''
    expect(sessionCookie).not.toBe('')

    await fetch(`/api/entries/${date}`, { method: 'DELETE', headers: authHeaders() })
  })

  it('returns 404 for a missing entry', async () => {
    const response = await fetch(`/api/entries/${date}`, { headers: authHeaders() })
    expect(response.status).toBe(404)
  })

  it('rejects invalid date and invalid payloads', async () => {
    expect((await fetch('/api/entries/2026-02-30', { headers: authHeaders() })).status).toBe(400)
    expect((await fetch(`/api/entries/${date}`, {
      method: 'PUT',
      headers: { ...authHeaders(), 'content-type': 'application/json' },
      body: JSON.stringify({ content: { type: 'paragraph' } }),
    })).status).toBe(400)
    expect((await fetch(`/api/entries/${date}`, {
      method: 'PUT',
      headers: { ...authHeaders(), 'content-type': 'application/json' },
      body: JSON.stringify({ mood: 'this is too long' }),
    })).status).toBe(400)
  })

  it('upserts and reads back', async () => {
    const created = await $fetch(`/api/entries/${date}`, {
      method: 'PUT',
      body: {
        mood: '😊',
        content: {
          type: 'doc',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: '早安' }] }],
        },
      },
      headers: authHeaders(),
    })
    expect(created.date).toBe(date)
    expect(created.mood).toBe('😊')

    const updated = await $fetch(`/api/entries/${date}`, { method: 'PUT', body: { mood: '😌' }, headers: authHeaders() })
    expect(updated.mood).toBe('😌')
    expect(updated.content.content[0].content[0].text).toBe('早安')
  })

  it('lists the month with an excerpt', async () => {
    const list = await $fetch('/api/entries', { query: { month: '2026-09' }, headers: authHeaders() })
    const hit = list.find((entry: { date: string }) => entry.date === date)
    expect(hit).toMatchObject({ date, mood: '😌', excerpt: '早安', firstImageUrl: null })
  })

  it('rejects a bad month', async () => {
    expect((await fetch('/api/entries?month=2026-13', { headers: authHeaders() })).status).toBe(400)
  })

  it('deletes and no longer returns the entry', async () => {
    expect((await fetch(`/api/entries/${date}`, { method: 'DELETE', headers: authHeaders() })).status).toBe(204)
    expect((await fetch(`/api/entries/${date}`, { headers: authHeaders() })).status).toBe(404)
  })
})
