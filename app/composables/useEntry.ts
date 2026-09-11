import { emptyDoc, isEmptyDoc } from '#shared/content'
import type { Entry, TiptapDoc } from '#shared/types'

export type EntrySaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export function useEntry(date: string) {
  const loadError = ref(false)
  const { data: entry } = useFetch<Entry | null>(`/api/entries/${date}`, {
    default: () => null,
    ignoreResponseError: true,
    onResponseError: ({ response }) => {
      if (response.status !== 404) loadError.value = true
    },
    transform: (value) => value && typeof value === 'object' && 'date' in value ? value : null,
  })

  const exists = ref(false)
  const mood = ref<string | null>(null)
  const content = ref<TiptapDoc>(emptyDoc())
  const status = ref<EntrySaveStatus>('idle')
  const savedAt = ref<Date | null>(null)

  watch(entry, (value) => {
    exists.value = Boolean(value)
    mood.value = value?.mood ?? null
    content.value = value?.content ?? emptyDoc()
    savedAt.value = value ? new Date(value.updatedAt) : null
    status.value = value ? 'saved' : 'idle'
  }, { immediate: true })

  let timer: ReturnType<typeof setTimeout> | undefined
  let dirty = false
  let saving = false

  async function save() {
    clearTimeout(timer)
    timer = undefined
    if (!dirty || saving) return

    dirty = false
    saving = true
    status.value = 'saving'
    try {
      const saved = await $fetch<Entry>(`/api/entries/${date}`, {
        method: 'PUT',
        body: { mood: mood.value, content: content.value },
      })
      exists.value = true
      savedAt.value = new Date(saved.updatedAt)
      status.value = 'saved'
    } catch {
      status.value = 'error'
      dirty = true
    } finally {
      saving = false
      if (dirty) schedule()
    }
  }

  function schedule() {
    dirty = true
    clearTimeout(timer)
    timer = setTimeout(() => { void save() }, 1200)
  }

  watch(mood, (value, oldValue) => {
    if (value === oldValue) return
    if (!exists.value) exists.value = true
    schedule()
  })
  watch(content, () => {
    if (exists.value || !isEmptyDoc(content.value)) schedule()
  }, { deep: true })

  function start() {
    exists.value = true
    schedule()
  }

  async function remove() {
    clearTimeout(timer)
    timer = undefined
    dirty = false
    await $fetch(`/api/entries/${date}`, { method: 'DELETE' })
    exists.value = false
    entry.value = null
    mood.value = null
    content.value = emptyDoc()
    savedAt.value = null
    status.value = 'idle'
  }

  onBeforeUnmount(() => {
    if (dirty) void save()
  })

  return {
    entry,
    loadError,
    exists,
    mood,
    content,
    status,
    savedAt,
    save,
    remove,
    start,
  }
}
