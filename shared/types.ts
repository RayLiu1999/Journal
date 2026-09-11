export type TiptapNode = {
  type: string
  text?: string
  attrs?: Record<string, unknown>
  content?: TiptapNode[]
}

export type TiptapDoc = {
  type: 'doc'
  content?: TiptapNode[]
}

export type EntrySummary = {
  date: string
  mood: string | null
  excerpt: string
  firstImageUrl: string | null
}

export type Entry = {
  date: string
  mood: string | null
  content: TiptapDoc
  updatedAt: string
}

export type Stats = {
  daysWritten: number
  streak: number
  moods: { mood: string; count: number }[]
  uploads: number
}
