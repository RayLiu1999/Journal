<script setup lang="ts">
withDefaults(defineProps<{ size?: number }>(), { size: 44 })

const model = defineModel<string | null>({ default: null })
const MOODS = ['😊', '😌', '🤩', '😐', '😔', '🥱', '😤']

function toggle(mood: string) {
  model.value = model.value === mood ? null : mood
}
</script>

<template>
  <div class="flex flex-wrap gap-2" role="radiogroup" aria-label="今天的心情">
    <button
      v-for="mood in MOODS"
      :key="mood"
      type="button"
      role="radio"
      :aria-label="`心情 ${mood}`"
      :aria-checked="model === mood"
      class="motion-press flex items-center justify-center rounded-full border-2"
      :style="{ width: `${size}px`, height: `${size}px`, fontSize: `${Math.round(size * 0.52)}px` }"
      :class="model === mood ? 'scale-105 border-accent bg-accent-soft shadow-sm' : 'border-transparent bg-chip hover:scale-[1.03] hover:border-line'"
      @click="toggle(mood)"
    >
      {{ mood }}
    </button>
  </div>
</template>
