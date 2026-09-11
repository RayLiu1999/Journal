function addDays(dateKey: string, delta: number): string {
  const parts = dateKey.split('-').map(Number)
  const year = parts[0]!
  const month = parts[1]!
  const day = parts[2]!
  const date = new Date(Date.UTC(year, month - 1, day + delta))
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`
}

export function streakEndingAt(dates: string[], today: string): number {
  const written = new Set(dates)
  let cursor = written.has(today) ? today : addDays(today, -1)
  let count = 0
  while (written.has(cursor)) {
    count += 1
    cursor = addDays(cursor, -1)
  }
  return count
}

export function moodCounts(moods: (string | null)[]): { mood: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const mood of moods) {
    if (mood) counts.set(mood, (counts.get(mood) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([mood, count], index) => ({ mood, count, index }))
    .sort((a, b) => b.count - a.count || a.index - b.index)
    .map(({ mood, count }) => ({ mood, count }))
}
