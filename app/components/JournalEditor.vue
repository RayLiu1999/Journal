<script setup lang="ts">
import { EditorContent, useEditor } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import { Placeholder } from '@tiptap/extensions'
import type { TiptapDoc } from '#shared/types'
import type { IconName } from './AppIcon.vue'

const props = defineProps<{ date: string }>()
const model = defineModel<TiptapDoc>({ required: true })
const emit = defineEmits<{
  uploading: [busy: boolean]
  error: [message: string]
}>()

type EditorTool = {
  icon: IconName
  active: boolean
  label: string
  run: () => void
} | null

const showEmoji = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const uploadError = ref('')

const editor = useEditor({
  content: model.value,
  extensions: [
    StarterKit.configure({ heading: { levels: [2] } }),
    Image.configure({ inline: false, allowBase64: false }),
    Placeholder.configure({ placeholder: '今天發生了什麼…' }),
  ],
  editorProps: {
    attributes: {
      class: 'prose-journal min-h-[40vh] outline-none',
      spellcheck: 'true',
    },
    handleDrop: (_view, event) => {
      const file = event.dataTransfer?.files?.[0]
      if (!file?.type.startsWith('image/')) return false
      void upload(file)
      return true
    },
    handlePaste: (_view, event) => {
      const file = event.clipboardData?.files?.[0]
      if (!file?.type.startsWith('image/')) return false
      void upload(file)
      return true
    },
  },
  onUpdate: ({ editor: currentEditor }) => {
    model.value = currentEditor.getJSON() as TiptapDoc
  },
})

watch(model, (doc) => {
  if (!editor.value) return
  if (JSON.stringify(editor.value.getJSON()) !== JSON.stringify(doc)) {
    editor.value.commands.setContent(doc, { emitUpdate: false })
  }
}, { deep: true })

async function upload(file: File) {
  uploadError.value = ''
  if (!file.type.startsWith('image/')) {
    uploadError.value = '只接受圖片檔案。'
    emit('error', uploadError.value)
    return
  }
  if (file.size > 10 * 1024 * 1024) {
    uploadError.value = '圖片不可超過 10MB。'
    emit('error', uploadError.value)
    return
  }

  emit('uploading', true)
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('date', props.date)
    const result = await $fetch<{ url: string }>('/api/upload', {
      method: 'POST',
      body: formData,
    })
    editor.value?.chain().focus().setImage({ src: result.url }).run()
  } catch {
    uploadError.value = '圖片上傳失敗，請稍後再試。'
    emit('error', uploadError.value)
  } finally {
    emit('uploading', false)
  }
}

function pickFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) void upload(file)
  input.value = ''
}

function insertEmoji(event: Event) {
  const unicode = (event as CustomEvent<{ unicode?: string }>).detail?.unicode
  if (unicode) editor.value?.chain().focus().insertContent(unicode).run()
  showEmoji.value = false
}

const tools = computed<EditorTool[]>(() => [
  {
    icon: 'heading',
    label: '標題',
    active: Boolean(editor.value?.isActive('heading')),
    run: () => editor.value?.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    icon: 'bold',
    label: '粗體',
    active: Boolean(editor.value?.isActive('bold')),
    run: () => editor.value?.chain().focus().toggleBold().run(),
  },
  {
    icon: 'italic',
    label: '斜體',
    active: Boolean(editor.value?.isActive('italic')),
    run: () => editor.value?.chain().focus().toggleItalic().run(),
  },
  null,
  {
    icon: 'list',
    label: '項目清單',
    active: Boolean(editor.value?.isActive('bulletList')),
    run: () => editor.value?.chain().focus().toggleBulletList().run(),
  },
  {
    icon: 'quote',
    label: '引用',
    active: Boolean(editor.value?.isActive('blockquote')),
    run: () => editor.value?.chain().focus().toggleBlockquote().run(),
  },
  null,
  {
    icon: 'image',
    label: '插入圖片',
    active: false,
    run: () => fileInput.value?.click(),
  },
  {
    icon: 'smile',
    label: '插入 emoji',
    active: showEmoji.value,
    run: () => { showEmoji.value = !showEmoji.value },
  },
])

onMounted(() => { void import('emoji-picker-element') })
onBeforeUnmount(() => editor.value?.destroy())

defineExpose({ tools, showEmoji, insertEmoji, uploadError })
</script>

<template>
  <div class="flex flex-col gap-4">
    <EditorContent :editor="editor" />
    <p v-if="uploadError" class="text-sm text-accent" role="alert">{{ uploadError }}</p>
    <input ref="fileInput" type="file" accept="image/*" class="hidden" aria-label="選擇圖片" @change="pickFile">
  </div>
</template>
