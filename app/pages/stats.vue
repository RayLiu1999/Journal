<script setup lang="ts">
import { formatMonthTitle } from '#shared/date'
import type { Stats } from '#shared/types'

const { month, direction, prev, next } = useMonth()
const emptyStats: Stats = { daysWritten: 0, streak: 0, moods: [], uploads: 0 }
const { data: stats, error } = await useFetch<Stats>('/api/stats', {
  query: { month },
  default: () => emptyStats,
  ignoreResponseError: true,
  transform: (value) => value && typeof value === 'object' && 'daysWritten' in value
    ? value as Stats
    : emptyStats,
})
const maxMoodCount = computed(() => stats.value?.moods[0]?.count ?? 1)
</script>

<template>
  <div class="flex min-h-dvh flex-col gap-5 px-5 pt-14 lg:gap-7 lg:px-12 lg:pt-10">
    <div class="flex items-end justify-between">
      <h1 class="font-serif text-[28px] font-bold lg:text-[32px]">統計</h1>
      <div class="flex items-center gap-1 pb-1.5">
        <button type="button" class="motion-press flex size-11 items-center justify-center text-ink2" aria-label="上個月" @click="prev">
          <AppIcon name="prev" :size="20" />
        </button>
        <Transition :name="`month-${direction}`" mode="out-in">
          <span :key="month" class="font-serif text-sm text-ink2 lg:text-[15px]">{{ formatMonthTitle(month) }}</span>
        </Transition>
        <button type="button" class="motion-press flex size-11 items-center justify-center text-ink2" aria-label="下個月" @click="next">
          <AppIcon name="next" :size="20" />
        </button>
      </div>
    </div>
    <p v-if="error" class="rounded-xl border border-line bg-card px-4 py-3 text-sm text-ink2">暫時無法載入統計，請確認資料庫設定。</p>
    <div class="flex flex-col gap-5 lg:w-[640px]">
      <div class="flex gap-3">
        <div v-for="tile in [{ label: '本月寫了', value: stats.daysWritten }, { label: '連續書寫', value: stats.streak }]" :key="tile.label" class="motion-card flex flex-1 flex-col gap-1 rounded-2xl border border-line bg-card p-4">
          <span class="text-xs text-ink2">{{ tile.label }}</span>
          <div class="flex items-baseline gap-1">
            <span class="font-serif text-[30px] font-bold leading-none">{{ tile.value }}</span>
            <span class="text-[13px] text-ink3">天</span>
          </div>
        </div>
      </div>
      <div class="motion-card flex flex-col gap-3.5 rounded-2xl border border-line bg-card px-4 py-[18px]">
        <span class="font-serif text-[15px] font-bold">本月心情分布</span>
        <p v-if="!stats.moods.length" class="text-sm text-ink2">這個月還沒有選過心情。</p>
        <div v-for="mood in stats.moods" :key="mood.mood" class="flex h-[34px] items-center gap-3 lg:h-[38px]">
          <span class="w-7 text-center text-[22px] leading-none">{{ mood.mood }}</span>
          <div class="h-2.5 grow overflow-hidden rounded bg-chip">
            <div class="h-full rounded-r bg-accent transition-[width] duration-500 ease-out" :style="{ width: `${Math.round((mood.count / maxMoodCount) * 100)}%` }" />
          </div>
          <span class="w-9 text-right text-[13px] text-ink2">{{ mood.count }} 天</span>
        </div>
      </div>
    </div>
  </div>
</template>
