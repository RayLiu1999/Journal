import { monthOf, shiftMonth, todayKey } from '#shared/date'

export function useMonth() {
  const month = useState<string>('month', () => monthOf(todayKey()))
  return {
    month,
    prev: () => { month.value = shiftMonth(month.value, -1) },
    next: () => { month.value = shiftMonth(month.value, 1) },
    today: () => { month.value = monthOf(todayKey()) },
  }
}
