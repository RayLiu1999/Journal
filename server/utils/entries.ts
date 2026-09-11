import { and, desc, eq, gte, lte } from 'drizzle-orm'
import { monthRange } from '#shared/date'
import { excerptOf, firstImageUrl } from '#shared/content'
import type { Entry, EntrySummary, TiptapDoc } from '#shared/types'
import { useDb } from '../db/client'
import { entries } from '../db/schema'

function toEntry(row: typeof entries.$inferSelect): Entry {
  return {
    date: row.date,
    mood: row.mood,
    content: row.content,
    updatedAt: row.updatedAt.toISOString(),
  }
}

export async function listEntrySummaries(month: string): Promise<EntrySummary[]> {
  const { start, end } = monthRange(month)
  const rows = await useDb()
    .select()
    .from(entries)
    .where(and(gte(entries.date, start), lte(entries.date, end)))
    .orderBy(desc(entries.date))

  return rows.map((row) => ({
    date: row.date,
    mood: row.mood,
    excerpt: excerptOf(row.content),
    firstImageUrl: firstImageUrl(row.content),
  }))
}

export async function listEntryDates(month: string): Promise<{ date: string; mood: string | null }[]> {
  const { start, end } = monthRange(month)
  return useDb()
    .select({ date: entries.date, mood: entries.mood })
    .from(entries)
    .where(and(gte(entries.date, start), lte(entries.date, end)))
    .orderBy(desc(entries.date))
}

export async function getEntry(date: string): Promise<Entry | null> {
  const [row] = await useDb().select().from(entries).where(eq(entries.date, date)).limit(1)
  return row ? toEntry(row) : null
}

export async function upsertEntry(
  date: string,
  patch: { mood?: string | null; content?: TiptapDoc },
): Promise<Entry> {
  const values: Partial<typeof entries.$inferInsert> = { updatedAt: new Date() }
  if (patch.mood !== undefined) values.mood = patch.mood
  if (patch.content !== undefined) values.content = patch.content

  const [row] = await useDb()
    .insert(entries)
    .values({ date, ...values })
    .onConflictDoUpdate({ target: entries.date, set: values })
    .returning()

  if (!row) throw new Error('Failed to save entry')
  return toEntry(row)
}

export async function deleteEntry(date: string): Promise<boolean> {
  const rows = await useDb()
    .delete(entries)
    .where(eq(entries.date, date))
    .returning({ date: entries.date })
  return rows.length > 0
}
