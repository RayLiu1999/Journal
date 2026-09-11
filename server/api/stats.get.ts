import { and, count, desc, gte, lt, lte } from 'drizzle-orm'
import { isMonthKey, monthOf, monthRange, shiftMonth, todayKey } from '#shared/date'
import { moodCounts, streakEndingAt } from '#shared/stats'
import type { Stats } from '#shared/types'
import { useDb } from '../db/client'
import { entries, images } from '../db/schema'

export default defineEventHandler(async (event): Promise<Stats> => {
  const today = todayKey()
  const query = getQuery(event)
  const month = typeof query.month === 'string' ? query.month : monthOf(today)
  if (!isMonthKey(month)) {
    throw createError({ statusCode: 400, statusMessage: 'month 格式須為 YYYY-MM' })
  }

  const rows = await listEntryDates(month)
  const recent = await useDb()
    .select({ date: entries.date })
    .from(entries)
    .where(lte(entries.date, today))
    .orderBy(desc(entries.date))
    .limit(400)

  const { start } = monthRange(month)
  const nextStart = `${shiftMonth(month, 1)}-01`
  const uploadRows = await useDb()
    .select({ uploads: count() })
    .from(images)
    .where(and(
      gte(images.createdAt, new Date(`${start}T00:00:00.000Z`)),
      lt(images.createdAt, new Date(`${nextStart}T00:00:00.000Z`)),
    ))

  return {
    daysWritten: rows.length,
    streak: streakEndingAt(recent.map((row) => row.date), today),
    moods: moodCounts(rows.map((row) => row.mood)),
    uploads: Number(uploadRows[0]?.uploads ?? 0),
  }
})
