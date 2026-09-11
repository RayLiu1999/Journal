const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/
const MONTH_RE = /^(\d{4})-(\d{2})$/
const DIGITS = ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九'] as const
const WEEKDAYS = ['', '一', '二', '三', '四', '五', '六', '日'] as const

const pad = (value: number) => String(value).padStart(2, '0')

function monthParts(monthKey: string): [number, number] {
  const match = MONTH_RE.exec(monthKey)
  if (!match) throw new RangeError(`Invalid month key: ${monthKey}`)
  const year = Number(match[1])
  const month = Number(match[2])
  if (year < 1 || month < 1 || month > 12) throw new RangeError(`Invalid month key: ${monthKey}`)
  return [year, month]
}

function dateParts(dateKey: string): [number, number, number] {
  const match = DATE_RE.exec(dateKey)
  if (!match) throw new RangeError(`Invalid date key: ${dateKey}`)
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (!isDateKey(dateKey)) throw new RangeError(`Invalid date key: ${dateKey}`)
  return [year, month, day]
}

export function isMonthKey(value: string): boolean {
  const match = MONTH_RE.exec(value)
  if (!match) return false
  const year = Number(match[1])
  const month = Number(match[2])
  return year >= 1 && month >= 1 && month <= 12
}

export function isDateKey(value: string): boolean {
  const match = DATE_RE.exec(value)
  if (!match) return false
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (year < 1 || month < 1 || month > 12 || day < 1) return false

  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day
}

export function todayKey(now: Date = new Date()): string {
  if (Number.isNaN(now.getTime())) throw new RangeError('Invalid date')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

export function monthOf(dateKey: string): string {
  dateParts(dateKey)
  return dateKey.slice(0, 7)
}

export function daysInMonth(monthKey: string): number {
  const [year, month] = monthParts(monthKey)
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

export function monthRange(monthKey: string): { start: string; end: string } {
  const lastDay = daysInMonth(monthKey)
  return { start: `${monthKey}-01`, end: `${monthKey}-${pad(lastDay)}` }
}

/** Returns 1=Monday through 7=Sunday, independent of the machine time zone. */
export function weekdayOf(dateKey: string): number {
  const [year, month, day] = dateParts(dateKey)
  const sundayZero = new Date(Date.UTC(year, month - 1, day)).getUTCDay()
  return sundayZero === 0 ? 7 : sundayZero
}

export function shiftMonth(monthKey: string, delta: number): string {
  const [year, month] = monthParts(monthKey)
  if (!Number.isFinite(delta)) throw new RangeError('Month delta must be finite')
  const total = year * 12 + (month - 1) + Math.trunc(delta)
  const shiftedYear = Math.floor(total / 12)
  const shiftedMonth = ((total % 12) + 12) % 12 + 1
  if (shiftedYear < 1 || shiftedYear > 9999) throw new RangeError('Shifted month is out of range')
  return `${shiftedYear}-${pad(shiftedMonth)}`
}

function chineseNumber(value: number): string {
  if (value <= 10) return value === 10 ? '十' : DIGITS[value] ?? String(value)
  if (value < 20) return `十${DIGITS[value % 10]}`
  const tens = Math.floor(value / 10)
  const ones = value % 10
  return `${DIGITS[tens]}十${ones ? DIGITS[ones] : ''}`
}

export function formatTitle(dateKey: string): string {
  const [, month, day] = dateParts(dateKey)
  return `${chineseNumber(month)}月${chineseNumber(day)}日`
}

export function formatWeekday(dateKey: string): string {
  return `星期${WEEKDAYS[weekdayOf(dateKey)]}`
}

export function formatMonthTitle(monthKey: string): string {
  const [year, month] = monthParts(monthKey)
  const yearText = String(year).padStart(4, '0').split('').map((digit) => DIGITS[Number(digit)]).join('')
  return `${yearText}年 ${chineseNumber(month)}月`
}
