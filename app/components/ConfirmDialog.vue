<script setup lang="ts">
defineProps<{
  title: string
  message: string
  confirmLabel: string
}>()

const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ confirm: [] }>()
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" @click.self="open = false">
    <div role="dialog" aria-modal="true" class="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-line bg-card p-6 shadow-xl">
      <h3 class="font-serif text-lg font-bold">{{ title }}</h3>
      <p class="text-sm leading-relaxed text-ink2">{{ message }}</p>
      <div class="flex justify-end gap-2">
        <button type="button" class="h-11 rounded-full px-5 text-sm hover:bg-chip" @click="open = false">取消</button>
        <button type="button" class="h-11 rounded-full bg-accent px-5 text-sm font-bold text-[#FFF7EE]" @click="emit('confirm'); open = false">
          {{ confirmLabel }}
        </button>
      </div>
    </div>
  </div>
</template>
