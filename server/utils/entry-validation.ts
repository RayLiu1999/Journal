import type { TiptapDoc, TiptapNode } from '#shared/types'

const MAX_MOOD_CODE_POINTS = 4
const MAX_CONTENT_DEPTH = 50

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isTiptapNode(value: unknown, depth = 0): value is TiptapNode {
  if (!isRecord(value) || typeof value.type !== 'string' || depth > MAX_CONTENT_DEPTH) return false
  if ('text' in value && typeof value.text !== 'string') return false
  if ('attrs' in value && !isRecord(value.attrs)) return false
  if (!('content' in value)) return true
  return Array.isArray(value.content) && value.content.every((node) => isTiptapNode(node, depth + 1))
}

export function isTiptapDoc(value: unknown): value is TiptapDoc {
  if (!isRecord(value) || value.type !== 'doc') return false
  return !('content' in value)
    || (Array.isArray(value.content) && value.content.every((node) => isTiptapNode(node)))
}

export function isValidMood(value: unknown): value is string | null {
  return value === null
    || (typeof value === 'string'
      && value.length > 0
      && [...value].length <= MAX_MOOD_CODE_POINTS)
}
