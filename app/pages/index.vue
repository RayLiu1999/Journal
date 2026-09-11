<script setup lang="ts">
import { formatMonthTitle, formatTitle, formatWeekday, todayKey } from '#shared/date'
import type { EntrySummary } from '#shared/types'

const { month, prev, next, today: goToday } = useMonth()
const today = todayKey()
const { data: list, error } = await useFetch<EntrySummary[]>('/api/entries', {
  query: { month },
  default: () => [],
  ignoreResponseError: true,
  transform: (value) => Array.isArray(value) ? value : [],
})

const moods = computed(() => Object.fromEntries((list.value ?? []).map((entry) => [entry.date, entry.mood])))
const todayEntry = computed(() => (list.value ?? []).find((entry) => entry.date === today) ?? null)
const open = (date: string) => navigateTo(`/entry/${date}`)
</script>

<template>
  <div class="flex min-h-dvh">
    <section class="flex min-w-0 grow flex-col gap-6 px-5 pt-14 lg:gap-7 lg:px-12 lg:pt-10">
      <div class="flex flex-col gap-1 lg:hidden">
        <span class="text-[13px] tracking-[0.08em] text-ink2">{{ formatWeekday(today) }}</span>
        <h1 class="font-serif text-[30px] font-bold leading-tight">{{ formatTitle(today) }}</h1>
      </div>

      <div class="flex items-center justify-between">
        <h2 class="hidden font-serif text-[32px] font-bold lg:block">{{ formatMonthTitle(month) }}</h2>
        <button type="button" class="flex size-11 items-center justify-center text-ink2 lg:hidden" aria-label="上個月" @click="prev">
          <AppIcon name="prev" />
        </button>
        <span class="font-serif text-base lg:hidden">{{ formatMonthTitle(month) }}</span>
        <button type="button" class="flex size-11 items-center justify-center text-ink2 lg:hidden" aria-label="下個月" @click="next">
          <AppIcon name="next" />
        </button>
        <div class="hidden items-center gap-1.5 lg:flex">
          <button type="button" class="flex size-11 items-center justify-center rounded-[10px] border border-line bg-card text-ink2" aria-label="上個月" @click="prev">
            <AppIcon name="prev" :size="20" />
          </button>
          <button type="button" class="flex h-11 items-center rounded-[10px] border border-line bg-card px-4 text-sm" @click="goToday">今天</button>
          <button type="button" class="flex size-11 items-center justify-center rounded-[10px] border border-line bg-card text-ink2" aria-label="下個月" @click="next">
            <AppIcon name="next" :size="20" />
          </button>
        </div>
      </div>

      <p v-if="error" class="rounded-xl border border-line bg-card px-4 py-3 text-sm text-ink2">
        暫時無法載入日記，請確認資料庫設定。
      </p>

      <MonthCalendar :month="month" :moods="moods" :today="today" size="md" class="lg:hidden" @select="open" />
      <MonthCalendar :month="month" :moods="moods" :today="today" size="lg" class="hidden lg:grid" @select="open" />

      <NuxtLink :to="`/entry/${today}`" class="flex items-center gap-3.5 rounded-2xl border border-line bg-card p-4 lg:hidden">
        <span class="text-[34px] leading-none">{{ todayEntry?.mood ?? '✏️' }}</span>
        <div class="flex min-w-0 grow flex-col gap-1">
          <span class="text-[13px] text-ink2">今天的日記</span>
          <span class="truncate text-[15px]">{{ todayEntry?.excerpt || '還沒寫，點一下開始。' }}</span>
        </div>
        <AppIcon name="chevron" :size="20" class="text-ink3" />
      </NuxtLink>
    </section>

    <aside class="hidden min-h-dvh w-[400px] shrink-0 flex-col gap-5 border-l border-line bg-card px-8 py-10 lg:flex">
      <div class="flex flex-col gap-1">
        <span class="text-[13px] tracking-[0.08em] text-ink2">{{ formatWeekday(today) }} · 今天</span>
        <h2 class="font-serif text-[26px] font-bold">{{ formatTitle(today) }}</h2>
      </div>
      <span v-if="todayEntry?.mood" class="text-[44px] leading-none">{{ todayEntry.mood }}</span>
      <p v-if="todayEntry" class="text-[15px] leading-[1.85]">{{ todayEntry.excerpt || '（沒有文字）' }}</p>
      <img v-if="todayEntry?.firstImageUrl" :src="todayEntry.firstImageUrl" class="h-[150px] w-full rounded-[10px] object-cover" alt="">
      <p v-if="!todayEntry" class="text-[15px] leading-[1.7] text-ink2">今天還沒有日記。</p>
      <div class="grow" />
      <NuxtLink :to="`/entry/${today}`" class="flex h-11 items-center justify-center gap-2 rounded-[10px] border border-line bg-paper text-sm">
        <AppIcon name="pen" :size="18" />{{ todayEntry ? '繼續寫' : '開始寫' }}
      </NuxtLink>
    </aside>
  </div>
</template>
