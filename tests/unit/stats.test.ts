import { describe, expect, it } from 'vitest'
import { moodCounts, streakEndingAt } from '../../shared/stats'

describe('streakEndingAt', () => {
  it('counts consecutive days ending today', () => {
    expect(streakEndingAt(['2026-09-09', '2026-09-10', '2026-09-11'], '2026-09-11')).toBe(3)
  })

  it('starts from yesterday when today is not written yet', () => {
    expect(streakEndingAt(['2026-09-09', '2026-09-10'], '2026-09-11')).toBe(2)
  })

  it('breaks on a gap and crosses month boundaries', () => {
    expect(streakEndingAt(['2026-08-31', '2026-09-01', '2026-09-03'], '2026-09-03')).toBe(1)
    expect(streakEndingAt(['2026-08-31', '2026-09-01'], '2026-09-01')).toBe(2)
    expect(streakEndingAt([], '2026-09-01')).toBe(0)
  })
})

describe('moodCounts', () => {
  it('counts and sorts descending, ignoring null', () => {
    expect(moodCounts(['😊', null, '😌', '😊'])).toEqual([
      { mood: '😊', count: 2 },
      { mood: '😌', count: 1 },
    ])
  })

  it('keeps first-seen order for ties', () => {
    expect(moodCounts(['😌', '😊'])).toEqual([
      { mood: '😌', count: 1 },
      { mood: '😊', count: 1 },
    ])
  })
})
