<script setup lang="ts">
import { formatMonthTitle } from '#shared/date'
import type { EntrySummary } from '#shared/types'

const { month, prev, next } = useMonth()
const { data: list, error } = await useFetch<EntrySummary[]>('/api/entries', {
  query: { month },
  default: () => [],
  ignoreResponseError: true,
  transform: (value) => Array.isArray(value) ? value : [],
})
</script>

<template>
  <div class="flex min-h-dvh flex-col gap-5 px-5 pt-14 lg:gap-7 lg:px-12 lg:pt-10">
    <div class="flex items-end justify-between">
      <h1 class="font-serif text-[28px] font-bold lg:text-[32px]">時間軸</h1>
      <div class="flex items-center gap-1 pb-1.5">
        <button type="button" class="flex size-11 items-center justify-center text-ink2" aria-label="上個月" @click="prev">
          <AppIcon name="prev" :size="20" />
        </button>
        <span class="font-serif text-sm text-ink2 lg:text-[15px]">{{ formatMonthTitle(month) }}</span>
        <button type="button" class="flex size-11 items-center justify-center text-ink2" aria-label="下個月" @click="next">
          <AppIcon name="next" :size="20" />
        </button>
      </div>
    </div>
    <p v-if="error" class="rounded-xl border border-line bg-card px-4 py-3 text-sm text-ink2">暫時無法載入日記，請確認資料庫設定。</p>
    <p v-else-if="!list?.length" class="text-sm text-ink2">這個月還沒有日記。</p>
    <div v-else class="flex flex-col gap-3.5 lg:w-[720px] lg:gap-[18px]">
      <TimelineCard v-for="entry in list" :key="entry.date" :entry="entry" size="m" class="lg:hidden" />
      <TimelineCard v-for="entry in list" :key="`large-${entry.date}`" :entry="entry" size="l" class="hidden lg:flex" />
    </div>
  </div>
</template>
