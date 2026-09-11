import { describe, expect, it } from 'vitest'
import { emptyDoc, excerptOf, firstImageUrl, isEmptyDoc, type TiptapDoc } from '../../shared/content'

const doc: TiptapDoc = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: '早上七點就醒了，' },
        { type: 'text', text: '窗外的光線很柔。' },
      ],
    },
    { type: 'image', attrs: { src: 'https://cdn/a.jpg' } },
    { type: 'paragraph', content: [{ type: 'text', text: '第二段。' }] },
    { type: 'image', attrs: { src: 'https://cdn/b.jpg' } },
  ],
}

describe('content helpers', () => {
  it('detects empty, whitespace-only, text and image documents', () => {
    expect(isEmptyDoc(emptyDoc())).toBe(true)
    expect(isEmptyDoc({ type: 'doc', content: [{ type: 'paragraph' }] })).toBe(true)
    expect(isEmptyDoc({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '  ' }] }] })).toBe(true)
    expect(isEmptyDoc({ type: 'doc', content: [{ type: 'image', attrs: { src: 'https://cdn/a.jpg' } }] })).toBe(false)
    expect(isEmptyDoc(doc)).toBe(false)
  })

  it('joins paragraphs with a space and truncates by unicode characters', () => {
    expect(excerptOf(doc)).toBe('早上七點就醒了，窗外的光線很柔。 第二段。')
    expect(excerptOf(doc, 5)).toBe('早上七點就…')
    expect(excerptOf(doc, 0)).toBe('')
  })

  it('finds the first non-empty image URL in document order', () => {
    expect(firstImageUrl(doc)).toBe('https://cdn/a.jpg')
    expect(firstImageUrl(emptyDoc())).toBeNull()
    expect(firstImageUrl({ type: 'doc', content: [{ type: 'image', attrs: { src: '  ' } }] })).toBeNull()
  })
})
