<script setup lang="ts">
import { todayKey } from '#shared/date'
import type { IconName } from '../components/AppIcon.vue'

const route = useRoute()
const items: { to: string; icon: IconName; label: string }[] = [
  { to: '/', icon: 'calendar', label: '月曆' },
  { to: '/timeline', icon: 'timeline', label: '時間軸' },
  { to: '/stats', icon: 'stats', label: '統計' },
  { to: '/settings', icon: 'settings', label: '設定' },
]

const isActive = (to: string) => to === '/'
  ? route.path === '/' || route.path.startsWith('/entry')
  : route.path.startsWith(to)
const hideMobileNav = computed(() => route.path.startsWith('/entry'))
</script>

<template>
  <div class="min-h-dvh bg-paper text-ink lg:flex">
    <aside class="sticky top-0 hidden h-dvh w-[232px] shrink-0 flex-col gap-7 border-r border-line bg-card px-5 py-8 lg:flex">
      <NuxtLink to="/" class="flex flex-col gap-0.5 px-2.5" aria-label="回到月曆首頁">
        <span class="font-serif text-xl font-bold">日記</span>
        <span class="text-xs text-ink3">一天，一頁</span>
      </NuxtLink>
      <nav class="flex flex-col gap-1" aria-label="主要導覽">
        <NuxtLink
          v-for="item in items"
          :key="item.to"
          :to="item.to"
          class="motion-press flex h-11 items-center gap-3 rounded-[10px] px-3 text-sm"
          :class="isActive(item.to) ? 'bg-accent-soft font-bold text-accent' : 'text-ink2 hover:bg-chip'"
        >
          <AppIcon :name="item.icon" :size="20" />
          <span :class="isActive(item.to) ? 'text-accent' : 'text-ink'">{{ item.label }}</span>
        </NuxtLink>
      </nav>
      <div class="grow" />
      <NuxtLink
        :to="`/entry/${todayKey()}`"
        class="motion-press flex h-11 items-center gap-3 rounded-[10px] bg-accent px-3 text-sm font-bold text-[#FFF7EE] hover:opacity-90"
      >
        <AppIcon name="pen" :size="18" />
        <span>寫今天的日記</span>
      </NuxtLink>
    </aside>

    <div class="flex min-w-0 grow flex-col">
      <main class="min-h-dvh grow" :class="hideMobileNav ? '' : 'pb-24 lg:pb-0'">
        <slot />
      </main>
      <nav
        v-if="!hideMobileNav"
        class="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-line bg-card px-2 pt-2.5 pb-[max(1.5rem,env(safe-area-inset-bottom))] lg:hidden"
        aria-label="主要導覽"
      >
        <NuxtLink
          v-for="item in items"
          :key="item.to"
          :to="item.to"
          class="motion-press flex min-h-11 min-w-16 flex-col items-center justify-center gap-0.5"
          :class="isActive(item.to) ? 'text-accent' : 'text-ink3'"
        >
          <AppIcon :name="item.icon" :size="22" />
          <span class="text-[11px]" :class="isActive(item.to) ? 'font-bold' : 'font-medium'">{{ item.label }}</span>
        </NuxtLink>
      </nav>
    </div>
  </div>
</template>
