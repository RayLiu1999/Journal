import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { $fetch, fetch, setup } from '@nuxt/test-utils/e2e'
import postgres from 'postgres'

const databaseUrl = process.env.DATABASE_URL_TEST
const authEmail = 'test@example.com'
const authPassword = 'test-password'
const authSecret = 'test-secret-that-is-long-enough-for-authentication'

describe.skipIf(!databaseUrl)('stats API', async () => {
  const dates = ['2031-03-01', '2031-03-02', '2031-03-05']
  let sessionCookie = ''
  const authHeaders = () => ({ cookie: sessionCookie })

  afterAll(async () => {
    const sql = postgres(databaseUrl!, { max: 1 })
    try {
      for (const date of dates) await sql`delete from entries where date = ${date}`
    } finally {
      await sql.end({ timeout: 5 })
    }
  })

  await setup({
    env: {
      NUXT_DATABASE_URL: databaseUrl!,
      NUXT_AUTH_EMAIL: authEmail,
      NUXT_AUTH_PASSWORD: authPassword,
      NUXT_AUTH_SECRET: authSecret,
    },
  })

  beforeAll(async () => {
    const login = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: authEmail, password: authPassword }),
    })
    expect(login.status).toBe(200)
    sessionCookie = login.headers.get('set-cookie')?.split(';', 1)[0] ?? ''
    expect(sessionCookie).not.toBe('')

    for (const [index, date] of dates.entries()) {
      await $fetch(`/api/entries/${date}`, {
        method: 'PUT',
        body: { mood: index === 2 ? '😌' : '😊' },
        headers: authHeaders(),
      })
    }
  })

  it('counts days and moods for the month', async () => {
    const stats = await $fetch('/api/stats', { query: { month: '2031-03' }, headers: authHeaders() })
    expect(stats.daysWritten).toBe(3)
    expect(stats.moods).toEqual([
      { mood: '😊', count: 2 },
      { mood: '😌', count: 1 },
    ])
    expect(typeof stats.streak).toBe('number')
    expect(typeof stats.uploads).toBe('number')
  })

  it('exports every entry', async () => {
    const all = await $fetch('/api/export', { headers: authHeaders() })
    expect(all.map((entry: { date: string }) => entry.date)).toEqual(expect.arrayContaining(dates))
  })
})
