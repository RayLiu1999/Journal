import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { $fetch, fetch, setup } from '@nuxt/test-utils/e2e'

const databaseUrl = process.env.DATABASE_URL_TEST

describe.skipIf(!databaseUrl)('stats API', async () => {
  await setup({ env: { NUXT_DATABASE_URL: databaseUrl! } })
  const dates = ['2031-03-01', '2031-03-02', '2031-03-05']

  beforeAll(async () => {
    for (const [index, date] of dates.entries()) {
      await $fetch(`/api/entries/${date}`, {
        method: 'PUT',
        body: { mood: index === 2 ? '😌' : '😊' },
      })
    }
  })

  afterAll(async () => {
    for (const date of dates) await fetch(`/api/entries/${date}`, { method: 'DELETE' })
  })

  it('counts days and moods for the month', async () => {
    const stats = await $fetch('/api/stats', { query: { month: '2031-03' } })
    expect(stats.daysWritten).toBe(3)
    expect(stats.moods).toEqual([
      { mood: '😊', count: 2 },
      { mood: '😌', count: 1 },
    ])
    expect(typeof stats.streak).toBe('number')
    expect(typeof stats.uploads).toBe('number')
  })

  it('exports every entry', async () => {
    const all = await $fetch('/api/export')
    expect(all.map((entry: { date: string }) => entry.date)).toEqual(expect.arrayContaining(dates))
  })
})
