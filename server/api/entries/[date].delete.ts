import { isDateKey } from '#shared/date'

export default defineEventHandler(async (event) => {
  const date = getRouterParam(event, 'date') ?? ''
  if (!isDateKey(date)) {
    throw createError({ statusCode: 400, statusMessage: 'date 格式須為 YYYY-MM-DD' })
  }

  await deleteEntry(date)
  setResponseStatus(event, 204)
  return null
})
