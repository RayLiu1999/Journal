import { isDateKey } from '#shared/date'
import type { TiptapDoc } from '#shared/types'
import { isTiptapDoc, isValidMood } from '../../utils/entry-validation'

export default defineEventHandler(async (event) => {
  const date = getRouterParam(event, 'date') ?? ''
  if (!isDateKey(date)) {
    throw createError({ statusCode: 400, statusMessage: 'date 格式須為 YYYY-MM-DD' })
  }

  const body = await readBody<Record<string, unknown> | null>(event)
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw createError({ statusCode: 400, statusMessage: '請提供 JSON 物件' })
  }

  const patch: { mood?: string | null; content?: TiptapDoc } = {}
  if ('mood' in body) {
    if (!isValidMood(body.mood)) {
      throw createError({ statusCode: 400, statusMessage: 'mood 須為 emoji 字串或 null' })
    }
    patch.mood = body.mood
  }
  if ('content' in body) {
    if (!isTiptapDoc(body.content)) {
      throw createError({ statusCode: 400, statusMessage: 'content 須為有效的 Tiptap doc' })
    }
    patch.content = body.content
  }
  if (Object.keys(patch).length === 0) {
    throw createError({ statusCode: 400, statusMessage: '至少需要提供 mood 或 content' })
  }

  return upsertEntry(date, patch)
})
