import { beforeAll, describe, expect, it } from 'vitest'
import { $fetch, fetch, setup } from '@nuxt/test-utils/e2e'

const databaseUrl = process.env.DATABASE_URL_TEST

describe.skipIf(!databaseUrl)('entries API', async () => {
  await setup({ env: { NUXT_DATABASE_URL: databaseUrl! } })

  const date = '2026-09-11'

  beforeAll(async () => {
    await fetch(`/api/entries/${date}`, { method: 'DELETE' })
  })

  it('returns 404 for a missing entry', async () => {
    const response = await fetch(`/api/entries/${date}`)
    expect(response.status).toBe(404)
  })

  it('rejects invalid date and invalid payloads', async () => {
    expect((await fetch('/api/entries/2026-02-30')).status).toBe(400)
    expect((await fetch(`/api/entries/${date}`, {
      method: 'PUT',
      body: { content: { type: 'paragraph' } },
    })).status).toBe(400)
    expect((await fetch(`/api/entries/${date}`, {
      method: 'PUT',
      body: { mood: 'this is too long' },
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
    })
    expect(created.date).toBe(date)
    expect(created.mood).toBe('😊')

    const updated = await $fetch(`/api/entries/${date}`, { method: 'PUT', body: { mood: '😌' } })
    expect(updated.mood).toBe('😌')
    expect(updated.content.content[0].content[0].text).toBe('早安')
  })

  it('lists the month with an excerpt', async () => {
    const list = await $fetch('/api/entries', { query: { month: '2026-09' } })
    const hit = list.find((entry: { date: string }) => entry.date === date)
    expect(hit).toMatchObject({ date, mood: '😌', excerpt: '早安', firstImageUrl: null })
  })

  it('rejects a bad month', async () => {
    expect((await fetch('/api/entries?month=2026-13')).status).toBe(400)
  })

  it('deletes and no longer returns the entry', async () => {
    expect((await fetch(`/api/entries/${date}`, { method: 'DELETE' })).status).toBe(204)
    expect((await fetch(`/api/entries/${date}`)).status).toBe(404)
  })
})
