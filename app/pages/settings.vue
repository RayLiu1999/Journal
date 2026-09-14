<script setup lang="ts">
import type { Stats } from '#shared/types'

const { theme, setTheme } = useTheme()
const emptyStats: Stats = { daysWritten: 0, streak: 0, moods: [], uploads: 0 }
const { data: stats, error } = await useFetch<Stats>('/api/stats', {
  default: () => emptyStats,
  ignoreResponseError: true,
  transform: (value) => value && typeof value === 'object' && 'uploads' in value
    ? value as Stats
    : emptyStats,
})
const themes: { key: 'light' | 'dark' | 'system'; label: string }[] = [
  { key: 'light', label: '淺色' },
  { key: 'dark', label: '深色' },
  { key: 'system', label: '跟隨系統' },
]
const cleared = ref(false)

async function clearCache() {
  if (!import.meta.client) return
  if ('caches' in window) {
    const keys = await window.caches.keys()
    await Promise.all(keys.map((key) => window.caches.delete(key)))
  }
  cleared.value = true
}
</script>

<template>
  <div class="flex min-h-dvh flex-col gap-6 px-5 pt-14 lg:gap-7 lg:px-12 lg:pt-10">
    <h1 class="font-serif text-[28px] font-bold lg:text-[32px]">設定</h1>
    <div class="flex flex-col gap-6 lg:w-[560px]">
      <section class="flex flex-col gap-2">
        <span class="px-1 text-xs tracking-[0.08em] text-ink3">外觀</span>
        <div class="flex min-h-[52px] items-center gap-3.5 rounded-2xl border border-line bg-card px-4 py-2.5">
          <AppIcon name="moon" :size="20" class="text-ink2" />
          <span class="grow text-[15px]">外觀</span>
          <div class="flex gap-1 rounded-[10px] bg-chip p-[3px]" role="group" aria-label="選擇外觀">
            <button v-for="item in themes" :key="item.key" type="button" class="motion-press rounded-lg px-2.5 py-1.5 text-xs" :class="theme === item.key ? 'bg-card font-bold text-ink' : 'text-ink2'" :aria-pressed="theme === item.key" @click="setTheme(item.key)">
              {{ item.label }}
            </button>
          </div>
        </div>
      </section>

      <section class="flex flex-col gap-2">
        <span class="px-1 text-xs tracking-[0.08em] text-ink3">儲存空間</span>
        <div class="flex flex-col rounded-2xl border border-line bg-card">
          <div class="flex min-h-[52px] items-center gap-3.5 px-4">
            <AppIcon name="cloud" :size="20" class="text-ink2" />
            <span class="grow text-[15px]">圖片儲存</span>
            <span class="text-[13px] text-ink3">S3</span>
          </div>
          <div class="mx-4 h-px bg-line" />
          <div class="flex min-h-[52px] items-center gap-3.5 px-4">
            <AppIcon name="image" :size="20" class="text-ink2" />
            <span class="grow text-[15px]">本月上傳</span>
            <span class="text-[13px] text-ink3">{{ stats.uploads }} 張</span>
          </div>
        </div>
      </section>

      <section class="flex flex-col gap-2">
        <span class="px-1 text-xs tracking-[0.08em] text-ink3">資料</span>
        <div class="flex flex-col rounded-2xl border border-line bg-card">
          <a href="/api/export" download="journal-export.json" class="motion-press flex min-h-[52px] items-center gap-3.5 px-4 hover:bg-chip">
            <AppIcon name="download" :size="20" class="text-ink2" />
            <span class="grow text-[15px]">匯出所有日記</span>
            <span class="text-[13px] text-ink3">JSON</span>
            <AppIcon name="chevron" :size="18" class="text-ink3" />
          </a>
          <div class="mx-4 h-px bg-line" />
          <button type="button" class="motion-press flex min-h-[52px] items-center gap-3.5 px-4 text-accent hover:bg-accent-soft" @click="clearCache">
            <AppIcon name="trash" :size="20" />
            <span class="grow text-left text-[15px]">{{ cleared ? '已清除本機快取' : '清除本機快取' }}</span>
          </button>
        </div>
      </section>

      <p v-if="error" class="text-xs text-ink3">統計資料暫時無法載入。</p>
      <span class="px-1 text-xs text-ink3">版本 0.1.0</span>
    </div>
  </div>
</template>
