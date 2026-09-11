import { asc } from 'drizzle-orm'
import type { Entry } from '#shared/types'
import { useDb } from '../db/client'
import { entries } from '../db/schema'

export default defineEventHandler(async (event): Promise<Entry[]> => {
  const rows = await useDb().select().from(entries).orderBy(asc(entries.date))
  setHeader(event, 'content-disposition', 'attachment; filename="journal-export.json"')
  setHeader(event, 'content-type', 'application/json; charset=utf-8')
  return rows.map((row) => ({
    date: row.date,
    mood: row.mood,
    content: row.content,
    updatedAt: row.updatedAt.toISOString(),
  }))
})
