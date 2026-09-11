<script setup lang="ts">
import { formatTitle, formatWeekday } from '#shared/date'

defineProps<{ date: string }>()
const mood = defineModel<string | null>('mood', { default: null })
const emit = defineEmits<{ start: [] }>()
</script>

<template>
  <div class="flex grow flex-col items-center justify-center gap-7 px-9 pb-20 text-center">
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" aria-hidden="true">
      <rect x="22" y="14" width="76" height="92" rx="8" class="fill-card stroke-line" stroke-width="2" />
      <path d="M36 40h48M36 54h48M36 68h30" class="stroke-line" stroke-width="2.5" stroke-linecap="round" />
      <path d="M78 96l22-22a5 5 0 0 0-7-7L71 89l-2 9z" class="fill-accent-soft stroke-accent" stroke-width="2" stroke-linejoin="round" />
    </svg>
    <div class="flex flex-col gap-2">
      <span class="hidden text-[13px] tracking-[0.08em] text-ink2 lg:block">{{ formatWeekday(date) }} · {{ formatTitle(date) }}</span>
      <h2 class="font-serif text-[22px] font-bold lg:text-[28px]">這一天還是空白的</h2>
      <p class="text-sm leading-[1.7] text-ink2 lg:text-[15px]">先選一個心情，或直接寫下一句話就好。</p>
    </div>
    <MoodPicker v-model="mood" :size="40" />
    <button type="button" class="flex h-12 items-center gap-2 rounded-full bg-accent px-7 text-[15px] font-bold text-[#FFF7EE]" @click="emit('start')">
      <AppIcon name="pen" :size="18" />開始寫這一天
    </button>
  </div>
</template>
