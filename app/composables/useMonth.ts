import { monthOf, shiftMonth, todayKey } from '#shared/date'

type MonthDirection = 'forward' | 'backward'

export function useMonth() {
  const month = useState<string>('month', () => monthOf(todayKey()))
  const direction = useState<MonthDirection>('month-direction', () => 'forward')

  function setMonth(nextMonth: string) {
    if (nextMonth === month.value) return
    direction.value = nextMonth > month.value ? 'forward' : 'backward'
    month.value = nextMonth
  }

  return {
    month,
    direction,
    prev: () => { setMonth(shiftMonth(month.value, -1)) },
    next: () => { setMonth(shiftMonth(month.value, 1)) },
    today: () => { setMonth(monthOf(todayKey())) },
  }
}
