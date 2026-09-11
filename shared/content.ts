import type { TiptapDoc, TiptapNode } from './types'

export type { TiptapDoc, TiptapNode } from './types'

export function emptyDoc(): TiptapDoc {
  return { type: 'doc', content: [] }
}

function* walk(nodes: TiptapNode[] | undefined): Generator<TiptapNode> {
  for (const node of nodes ?? []) {
    yield node
    yield* walk(node.content)
  }
}

function blockTexts(doc: TiptapDoc): string[] {
  const result: string[] = []
  for (const block of doc.content ?? []) {
    const text = [...walk(block.content)]
      .filter((node) => node.type === 'text')
      .map((node) => node.text ?? '')
      .join('')
    if (text.trim()) result.push(text)
  }
  return result
}

export function isEmptyDoc(doc: TiptapDoc): boolean {
  if (blockTexts(doc).length > 0) return false
  return ![...walk(doc.content)].some((node) => node.type === 'image')
}

export function excerptOf(doc: TiptapDoc, max = 80): string {
  if (max <= 0) return ''
  const text = blockTexts(doc).join(' ')
  const characters = [...text]
  return characters.length > max
    ? `${characters.slice(0, max).join('')}…`
    : text
}

export function firstImageUrl(doc: TiptapDoc): string | null {
  for (const node of walk(doc.content)) {
    if (node.type !== 'image') continue
    const source = node.attrs?.src
    if (typeof source === 'string' && source.trim()) return source
  }
  return null
}
