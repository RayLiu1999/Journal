import { isMonthKey, monthOf, todayKey } from '#shared/date'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const month = typeof query.month === 'string' ? query.month : monthOf(todayKey())
  if (!isMonthKey(month)) {
    throw createError({ statusCode: 400, statusMessage: 'month 格式須為 YYYY-MM' })
  }
  return listEntrySummaries(month)
})
