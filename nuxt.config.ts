import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2026-09-01',
  devtools: { enabled: true },
  modules: ['@vite-pwa/nuxt'],
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [tailwindcss()],
  },
  vue: {
    compilerOptions: {
      isCustomElement: (tag) => tag === 'emoji-picker',
    },
  },
  app: {
    head: {
      htmlAttrs: { lang: 'zh-Hant-TW' },
      title: '紙頁日記',
      meta: [
        {
          name: 'viewport',
          content: 'width=device-width, initial-scale=1, viewport-fit=cover',
        },
        { name: 'theme-color', content: '#F4EDE0' },
      ],
      link: [
        { rel: 'icon', type: 'image/png', sizes: '192x192', href: '/icons/icon-192.png' },
        { rel: 'apple-touch-icon', sizes: '192x192', href: '/icons/icon-192.png' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@500;700&family=Noto+Sans+TC:wght@400;500;700&display=swap',
        },
      ],
    },
  },
  runtimeConfig: {
    databaseUrl: '',
    s3: {
      endpoint: '',
      region: 'auto',
      bucket: '',
      accessKeyId: '',
      secretAccessKey: '',
      publicBaseUrl: '',
    },
  },
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: '紙頁日記',
      short_name: '日記',
      lang: 'zh-Hant-TW',
      display: 'standalone',
      start_url: '/',
      background_color: '#F4EDE0',
      theme_color: '#F4EDE0',
      icons: [
        { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
      ],
    },
    workbox: {
      navigateFallback: null,
      globPatterns: [],
    },
  },
})
