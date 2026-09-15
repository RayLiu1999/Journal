export function useAuth() {
  async function logout() {
    try {
      await $fetch('/api/auth/logout', { method: 'POST' })
    } finally {
      await navigateTo('/login')
    }
  }

  return { logout }
}
