export type Theme = 'light' | 'dark' | 'system'

const KEY = 'journal-theme'

export function useTheme() {
  const theme = useState<Theme>('theme', () => 'system')

  function apply(value: Theme) {
    if (!import.meta.client) return
    const dark = value === 'dark'
      || (value === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  }

  function setTheme(value: Theme) {
    theme.value = value
    if (import.meta.client) {
      try {
        localStorage.setItem(KEY, value)
      } catch {
        // Private browsing can reject localStorage; the current session still works.
      }
      apply(value)
    }
  }

  onMounted(() => {
    try {
      const stored = localStorage.getItem(KEY)
      if (stored === 'light' || stored === 'dark' || stored === 'system') theme.value = stored
    } catch {
      // Use the system default when storage is unavailable.
    }

    apply(theme.value)
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => apply(theme.value)
    media.addEventListener('change', onChange)
    onBeforeUnmount(() => media.removeEventListener('change', onChange))
  })

  return { theme, setTheme }
}
