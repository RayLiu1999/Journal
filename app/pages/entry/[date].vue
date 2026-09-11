<script setup lang="ts">
import { formatTitle, formatWeekday, isDateKey, monthOf, todayKey } from '#shared/date'
import type { EntrySummary } from '#shared/types'
import type { IconName } from '../../components/AppIcon.vue'
import type { EntrySaveStatus } from '../../composables/useEntry'

type EditorTool = {
  icon: IconName
  active: boolean
  label: string
  run: () => void
} | null
type EditorExposed = {
  tools: ComputedRef<EditorTool[]>
  showEmoji: Ref<boolean>
  insertEmoji: (event: Event) => void
}

const route = useRoute()
const date = String(route.params.date ?? '')
if (!isDateKey(date)) throw createError({ statusCode: 404, statusMessage: '日期格式不正確' })

const { exists, mood, content, status, savedAt, loadError, save, remove, start } = useEntry(date)
const editorRef = ref<EditorExposed | null>(null)
const uploading = ref(false)
const uploadError = ref('')
const menuOpen = ref(false)
const confirmOpen = ref(false)

const month = monthOf(date)
const { data: list, error: listError } = await useFetch<EntrySummary[]>('/api/entries', {
  query: { month },
  default: () => [],
  ignoreResponseError: true,
  transform: (value) => Array.isArray(value) ? value : [],
})
const moods = computed(() => Object.fromEntries((list.value ?? []).map((entry) => [entry.date, entry.mood])))
const recent = computed(() => (list.value ?? []).filter((entry) => entry.date !== date).slice(0, 3))

const statusText = computed(() => {
  if (uploading.value) return '圖片上傳中…'
  if (uploadError.value) return uploadError.value
  if (status.value === 'saving') return '儲存中…'
  if (status.value === 'error') return '儲存失敗，稍後重試'
  if (savedAt.value) {
    return `已自動儲存 · ${savedAt.value.toLocaleTimeString('zh-TW', { hour: 'numeric', minute: '2-digit' })}`
  }
  if (loadError.value || listError.value) return '目前無法連線'
  return ''
})

async function onDelete() {
  try {
    await remove()
    await navigateTo('/')
  } catch {
    uploadError.value = '刪除失敗，請稍後再試。'
  }
}

async function done() {
  await save()
  await navigateTo('/')
}
</script>

<template>
  <div class="flex min-h-dvh">
    <aside class="hidden w-[340px] shrink-0 flex-col gap-5 border-r border-line px-7 py-10 lg:flex">
      <MonthCalendar :month="month" :moods="moods" :today="todayKey()" size="sm" @select="(selectedDate) => navigateTo(`/entry/${selectedDate}`)" />
      <div class="h-px bg-line" />
      <span class="text-xs tracking-[0.08em] text-ink3">最近</span>
      <p v-if="!recent.length" class="text-sm text-ink2">這個月還沒有其他日記。</p>
      <NuxtLink v-for="entry in recent" :key="entry.date" :to="`/entry/${entry.date}`" class="flex items-center gap-2.5 rounded-[10px] border border-line bg-card px-3 py-2.5 transition-colors hover:border-accent">
        <span class="text-lg leading-none">{{ entry.mood ?? '·' }}</span>
        <span class="w-8 text-xs text-ink2">{{ Number(entry.date.slice(-2)) }} 日</span>
        <span class="truncate text-[13px]">{{ entry.excerpt || '（沒有文字）' }}</span>
      </NuxtLink>
    </aside>

    <div class="flex min-w-0 grow flex-col">
      <header class="flex items-center justify-between px-4 pt-[54px] pb-2 lg:hidden">
        <NuxtLink to="/" class="flex size-11 items-center" aria-label="返回月曆">
          <AppIcon name="back" :size="24" />
        </NuxtLink>
        <span class="font-serif text-[17px] font-bold">{{ formatTitle(date) }} · {{ formatWeekday(date) }}</span>
        <button v-if="exists" type="button" class="flex size-11 items-center justify-end" aria-label="更多" @click="menuOpen = !menuOpen">
          <AppIcon name="more" :size="24" />
        </button>
        <span v-else class="size-11" />
      </header>

      <template v-if="!exists">
        <EmptyEntry :date="date" v-model:mood="mood" @start="start" />
      </template>

      <template v-else>
        <div class="hidden items-center justify-between px-12 pt-6 lg:flex">
          <div class="flex w-fit items-center gap-0.5 rounded-[14px] border border-line bg-card px-1.5 py-1">
            <template v-for="(tool, index) in editorRef?.tools ?? []" :key="index">
              <div v-if="!tool" class="mx-1 h-[22px] w-px bg-line" />
              <button v-else type="button" class="flex size-10 items-center justify-center rounded-[10px] text-ink2" :class="tool.active ? 'bg-accent-soft text-accent' : 'hover:bg-chip'" :aria-label="tool.label" @click="tool.run">
                <AppIcon :name="tool.icon" :size="20" />
              </button>
            </template>
          </div>
          <div class="flex items-center gap-3.5">
            <span class="text-[13px] text-ink3">{{ statusText }}</span>
            <button type="button" class="flex size-11 items-center justify-center text-ink2" aria-label="更多" @click="menuOpen = !menuOpen">
              <AppIcon name="more" />
            </button>
          </div>
        </div>

        <div class="relative grow px-5 pt-2 lg:flex lg:justify-center lg:px-12 lg:pt-9">
          <div class="flex w-full flex-col gap-4 lg:w-[640px] lg:gap-6">
            <div class="hidden flex-col gap-1.5 lg:flex">
              <span class="text-[13px] tracking-[0.08em] text-ink2">{{ formatWeekday(date) }}</span>
              <h1 class="font-serif text-[36px] font-bold">{{ formatTitle(date) }}</h1>
            </div>
            <div class="flex flex-col gap-2.5">
              <span class="text-xs tracking-[0.08em] text-ink2 lg:hidden">今天的心情</span>
              <MoodPicker v-model="mood" :size="40" class="lg:hidden" />
              <MoodPicker v-model="mood" :size="44" class="hidden lg:flex" />
            </div>
            <div class="h-px bg-line" />
            <JournalEditor ref="editorRef" v-model="content" :date="date" @uploading="uploading = $event" @error="uploadError = $event" />
            <div class="h-40 lg:h-10" />
          </div>
          <div v-if="menuOpen" class="absolute right-5 top-0 z-40 rounded-xl border border-line bg-card p-1 shadow-lg lg:right-12 lg:top-2" @click="menuOpen = false">
            <button type="button" class="flex h-11 items-center gap-2 rounded-lg px-3 text-sm text-accent hover:bg-accent-soft" @click="confirmOpen = true">
              <AppIcon name="trash" :size="18" />刪除這一天
            </button>
          </div>
        </div>

        <div class="fixed inset-x-0 bottom-0 z-30 flex flex-col gap-2.5 bg-paper px-4 pt-2.5 pb-[max(1.5rem,env(safe-area-inset-bottom))] lg:hidden">
          <div class="flex items-center gap-0.5 rounded-[14px] border border-line bg-card px-1.5 py-1">
            <template v-for="(tool, index) in editorRef?.tools ?? []" :key="index">
              <div v-if="!tool" class="mx-1 h-[22px] w-px bg-line" />
              <button v-else type="button" class="flex size-10 items-center justify-center rounded-[10px] text-ink2" :class="tool.active ? 'bg-accent-soft text-accent' : 'hover:bg-chip'" :aria-label="tool.label" @click="tool.run">
                <AppIcon :name="tool.icon" :size="20" />
              </button>
            </template>
          </div>
          <div class="flex items-center justify-between">
            <span class="max-w-[65%] truncate text-xs text-ink3">{{ statusText }}</span>
            <button type="button" class="flex h-11 items-center rounded-full bg-accent px-5 text-[15px] font-bold text-[#FFF7EE]" @click="done">完成</button>
          </div>
        </div>

        <div v-if="editorRef?.showEmoji" class="fixed inset-x-4 bottom-36 z-40 lg:absolute lg:left-12 lg:top-20 lg:w-[360px]">
          <emoji-picker @emoji-click="editorRef?.insertEmoji($event)" />
        </div>
      </template>
    </div>

    <ConfirmDialog v-model:open="confirmOpen" title="刪除這一天的日記？" message="刪除後無法復原，圖片仍會留在儲存空間。" confirm-label="刪除" @confirm="onDelete" />
  </div>
</template>
