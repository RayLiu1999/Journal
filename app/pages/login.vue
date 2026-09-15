<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const route = useRoute()
const email = ref('')
const password = ref('')
const pending = ref(false)
const errorMessage = ref('')

const redirectTarget = computed(() => {
  const value = route.query.redirect
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return '/'
  return value
})

async function submit() {
  if (pending.value) return

  errorMessage.value = ''
  pending.value = true
  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: { email: email.value, password: password.value },
    })
    await navigateTo(redirectTarget.value)
  } catch {
    errorMessage.value = '登入失敗，請確認帳號密碼或稍後再試。'
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <section class="motion-card rounded-[28px] border border-line bg-card px-6 py-8 shadow-[0_18px_60px_rgba(80,58,35,0.10)] sm:px-9 sm:py-10">
    <div class="mb-8 flex flex-col items-center text-center">
      <img src="/icons/icon-192.png" alt="" width="72" height="72" class="mb-5 rounded-[20px] shadow-[0_8px_24px_rgba(80,58,35,0.14)]">
      <p class="mb-1 font-serif text-2xl font-bold">紙頁日記</p>
      <p class="text-sm text-ink3">登入後，回到你的每一天</p>
    </div>

    <form class="flex flex-col gap-5" @submit.prevent="submit">
      <div class="flex flex-col gap-2">
        <label for="login-email" class="text-sm font-bold">Email</label>
        <input
          id="login-email"
          v-model="email"
          type="email"
          name="email"
          autocomplete="email"
          inputmode="email"
          required
          class="h-12 rounded-xl border border-line bg-paper px-4 text-[15px] outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
          placeholder="you@example.com"
        >
      </div>

      <div class="flex flex-col gap-2">
        <label for="login-password" class="text-sm font-bold">密碼</label>
        <input
          id="login-password"
          v-model="password"
          type="password"
          name="password"
          autocomplete="current-password"
          required
          class="h-12 rounded-xl border border-line bg-paper px-4 text-[15px] outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
          placeholder="輸入密碼"
        >
      </div>

      <p v-if="errorMessage" role="alert" class="rounded-xl bg-accent-soft px-3.5 py-3 text-sm text-accent">
        {{ errorMessage }}
      </p>

      <button
        type="submit"
        :disabled="pending"
        class="motion-press mt-1 flex h-12 items-center justify-center rounded-xl bg-accent px-4 text-sm font-bold text-[#FFF7EE] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {{ pending ? '登入中…' : '登入' }}
      </button>
    </form>
  </section>
</template>
