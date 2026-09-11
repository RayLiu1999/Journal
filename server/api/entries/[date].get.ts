import { isDateKey } from '#shared/date'

export default defineEventHandler(async (event) => {
  const date = getRouterParam(event, 'date') ?? ''
  if (!isDateKey(date)) {
    throw createError({ statusCode: 400, statusMessage: 'date 格式須為 YYYY-MM-DD' })
  }

  const entry = await getEntry(date)
  if (!entry) throw createError({ statusCode: 404, statusMessage: '這一天還沒有日記' })
  return entry
})
