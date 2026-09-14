<script setup lang="ts">
import { weekdayOf } from '#shared/date'
import type { EntrySummary } from '#shared/types'

const props = withDefaults(defineProps<{ entry: EntrySummary; size?: 'm' | 'l' }>(), { size: 'm' })
const WEEK = ['', '週一', '週二', '週三', '週四', '週五', '週六', '週日']
const day = computed(() => Number(props.entry.date.slice(-2)))
</script>

<template>
  <NuxtLink :to="`/entry/${entry.date}`" class="flex gap-3.5 group">
    <div class="flex w-11 shrink-0 flex-col items-center gap-0.5 pt-1.5">
      <span class="font-serif font-bold leading-none" :class="size === 'l' ? 'text-[26px]' : 'text-[22px]'">{{ day }}</span>
      <span class="text-[11px] text-ink3">{{ WEEK[weekdayOf(entry.date)] }}</span>
    </div>
    <div class="motion-card flex min-w-0 grow flex-col gap-3 rounded-2xl border border-line bg-card px-4 py-3.5 group-hover:border-accent">
      <div class="flex items-start gap-2.5">
        <span class="text-[22px] leading-none">{{ entry.mood ?? '·' }}</span>
        <p class="line-clamp-2 leading-[1.7]" :class="size === 'l' ? 'text-[15px]' : 'text-sm'">{{ entry.excerpt || '（沒有文字）' }}</p>
      </div>
      <img v-if="entry.firstImageUrl" :src="entry.firstImageUrl" alt="" class="w-full rounded-[10px] object-cover" :class="size === 'l' ? 'h-40' : 'h-[120px]'">
    </div>
  </NuxtLink>
</template>
