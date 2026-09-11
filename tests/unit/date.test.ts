import { describe, expect, it } from 'vitest'
import {
  daysInMonth,
  formatMonthTitle,
  formatTitle,
  formatWeekday,
  isDateKey,
  isMonthKey,
  monthOf,
  monthRange,
  shiftMonth,
  todayKey,
  weekdayOf,
} from '../../shared/date'

describe('date keys', () => {
  it('validates real date keys', () => {
    expect(isDateKey('2026-09-11')).toBe(true)
    expect(isDateKey('2024-02-29')).toBe(true)
    expect(isDateKey('2026-02-29')).toBe(false)
    expect(isDateKey('2026-02-30')).toBe(false)
    expect(isDateKey('2026-9-1')).toBe(false)
    expect(isDateKey('hello')).toBe(false)
  })

  it('validates month keys', () => {
    expect(isMonthKey('2026-09')).toBe(true)
    expect(isMonthKey('2026-13')).toBe(false)
    expect(isMonthKey('2026-00')).toBe(false)
    expect(isMonthKey('2026-9')).toBe(false)
  })

  it('uses the local calendar date for todayKey', () => {
    expect(todayKey(new Date(2026, 8, 11, 23, 59))).toBe('2026-09-11')
  })

  it('calculates month boundaries and leap years', () => {
    expect(monthOf('2026-09-11')).toBe('2026-09')
    expect(monthRange('2026-09')).toEqual({ start: '2026-09-01', end: '2026-09-30' })
    expect(daysInMonth('2024-02')).toBe(29)
    expect(daysInMonth('2026-02')).toBe(28)
  })

  it('returns Monday=1 through Sunday=7', () => {
    expect(weekdayOf('2026-09-07')).toBe(1)
    expect(weekdayOf('2026-09-11')).toBe(5)
    expect(weekdayOf('2026-09-13')).toBe(7)
  })

  it('shifts months across year boundaries', () => {
    expect(shiftMonth('2026-12', 1)).toBe('2027-01')
    expect(shiftMonth('2026-01', -1)).toBe('2025-12')
    expect(shiftMonth('2026-01', -13)).toBe('2024-12')
  })
})

describe('Traditional Chinese formatting', () => {
  it('formats dates and months', () => {
    expect(formatTitle('2026-09-11')).toBe('九月十一日')
    expect(formatTitle('2026-10-20')).toBe('十月二十日')
    expect(formatTitle('2026-12-31')).toBe('十二月三十一日')
    expect(formatWeekday('2026-09-11')).toBe('星期五')
    expect(formatMonthTitle('2026-09')).toBe('二〇二六年 九月')
  })

  it('rejects invalid inputs for derived values', () => {
    expect(() => monthRange('2026-13')).toThrow(RangeError)
    expect(() => formatTitle('2026-02-30')).toThrow(RangeError)
  })
})
