<script setup lang="ts">
import { daysInMonth, formatTitle, weekdayOf } from '#shared/date'

const props = withDefaults(defineProps<{
  month: string
  moods: Record<string, string | null>
  today: string
  size?: 'sm' | 'md' | 'lg'
}>(), { size: 'md' })

const emit = defineEmits<{ select: [date: string] }>()
const WEEK = ['一', '二', '三', '四', '五', '六', '日']
const pad = (value: number) => String(value).padStart(2, '0')

const days = computed(() => Array.from(
  { length: daysInMonth(props.month) },
  (_, index) => `${props.month}-${pad(index + 1)}`,
))
const leadingEmptyDays = computed(() => weekdayOf(days.value[0]!) - 1)

const cellClass = computed(() => ({
  sm: 'h-[38px] text-xs',
  md: 'h-12 text-sm',
  lg: 'h-[118px] text-[15px]',
}[props.size]))
const emojiClass = computed(() => ({
  sm: 'text-sm',
  md: 'text-lg',
  lg: 'text-[26px]',
}[props.size]))
const gapClass = computed(() => ({
  sm: 'gap-[3px]',
  md: 'gap-1',
  lg: 'gap-2',
}[props.size]))
</script>

<template>
  <div class="grid grid-cols-7" :class="gapClass">
    <div v-for="weekday in WEEK" :key="weekday" class="pb-1 text-center text-xs text-ink3">
      {{ weekday }}
    </div>
    <div v-for="index in leadingEmptyDays" :key="`empty-${index}`" aria-hidden="true" />
    <button
      v-for="date in days"
      :key="date"
      type="button"
      class="flex flex-col items-center justify-center gap-px rounded-[10px] border transition-colors hover:border-accent"
      :class="[
        cellClass,
        date === today
          ? 'border-accent bg-today font-bold'
          : moods[date] !== undefined
            ? 'border-line bg-card'
            : 'border-transparent',
        date > today ? 'text-ink3' : 'text-ink',
      ]"
      :aria-label="formatTitle(date)"
      @click="emit('select', date)"
    >
      <span class="leading-none">{{ Number(date.slice(-2)) }}</span>
      <span class="leading-tight" :class="emojiClass">{{ moods[date] ?? '' }}</span>
    </button>
  </div>
</template>
