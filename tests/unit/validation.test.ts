import { describe, expect, it } from 'vitest'
import { isTiptapDoc, isValidMood } from '../../server/utils/entry-validation'

describe('entry validation', () => {
  it('accepts a normal Tiptap document', () => {
    expect(isTiptapDoc({
      type: 'doc',
      content: [{
        type: 'paragraph',
        content: [{ type: 'text', text: '今天完成了第一版。' }],
      }],
    })).toBe(true)
  })

  it('rejects malformed or excessively deep Tiptap documents', () => {
    expect(isTiptapDoc({ type: 'paragraph' })).toBe(false)
    expect(isTiptapDoc({ type: 'doc', content: [{ type: 'text', text: 42 }] })).toBe(false)
    expect(isTiptapDoc({ type: 'doc', content: [{ type: 'image', attrs: [] }] })).toBe(false)
    expect(isTiptapDoc({ type: 'doc', content: { type: 'paragraph' } })).toBe(false)

    let deep: Record<string, unknown> = { type: 'leaf' }
    for (let index = 0; index < 51; index += 1) deep = { type: 'node', content: [deep] }
    expect(isTiptapDoc({ type: 'doc', content: [deep] })).toBe(false)
  })

  it('accepts null and short emoji moods but rejects empty or long values', () => {
    expect(isValidMood(null)).toBe(true)
    expect(isValidMood('😊')).toBe(true)
    expect(isValidMood('😊😊😊😊')).toBe(true)
    expect(isValidMood('')).toBe(false)
    expect(isValidMood('😊😊😊😊😊')).toBe(false)
    expect(isValidMood('this is too long')).toBe(false)
  })
})
