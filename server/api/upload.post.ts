import { isDateKey } from '#shared/date'
import { useDb } from '../db/client'
import { images } from '../db/schema'
import { objectKeyFor, uploadImage } from '../utils/s3'

const MAX_BYTES = 10 * 1024 * 1024

export default defineEventHandler(async (event) => {
  const parts = await readMultipartFormData(event)
  const file = parts?.find((part) => part.name === 'file')
  const datePart = parts?.find((part) => part.name === 'date')
  const dateRaw = datePart?.data?.toString().trim()

  if (!file?.data?.length) throw createError({ statusCode: 400, statusMessage: '缺少檔案' })
  if (!file.type?.startsWith('image/')) throw createError({ statusCode: 415, statusMessage: '只接受圖片' })
  if (file.data.length > MAX_BYTES) throw createError({ statusCode: 413, statusMessage: '圖片不可超過 10MB' })

  let date: string | null = null
  if (dateRaw) {
    if (!isDateKey(dateRaw)) throw createError({ statusCode: 400, statusMessage: 'date 格式須為 YYYY-MM-DD' })
    date = dateRaw
  }

  const key = objectKeyFor(date, file.filename ?? 'image')
  const url = await uploadImage(file.data, key, file.type)
  const entryExists = date ? Boolean(await getEntry(date)) : false

  await useDb().insert(images).values({
    key,
    url,
    entryDate: entryExists ? date : null,
  })

  return { url, key }
})
