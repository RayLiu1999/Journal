# 紙頁日記 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立一個單人、一天一篇、支援心情 emoji、Tiptap 內文、S3 圖片上傳、可安裝為 PWA 的 Nuxt 全端日記。

**Architecture:** Nuxt 4 單一專案：`server/` 用 Nitro 提供 REST API（Drizzle + PostgreSQL、S3 上傳），`app/` 用 Vue 頁面消費 API。共用的純邏輯（日期、摘要、統計）放 `shared/` 讓前後端與單元測試共用。樣式用 Tailwind v4 加 CSS 變數色票，完全對照 `design/` 的設計稿。

**Tech Stack:** Nuxt 4.5、TypeScript、Tailwind CSS 4.3、Tiptap 3.31、emoji-picker-element 1.29、Drizzle ORM 0.45 + postgres 3.4、@aws-sdk/client-s3、@vite-pwa/nuxt 1.1、vitest 5 + @nuxt/test-utils 4。

**Spec:** `docs/superpowers/specs/2026-09-11-paper-journal-spec.md`

## Global Constraints

- 套件管理用 npm；Node 24。
- 日期主鍵格式 `YYYY-MM-DD`；月份參數 `YYYY-MM`。
- 色彩只用規格表列的 hex，透過 CSS 變數；深色模式以 `html[data-theme="dark"]` 切換。
- 圖示一律描邊 SVG；emoji 只用在心情與內文。
- 觸控目標最小 44px。
- 介面文字全為繁體中文，與設計稿一致。
- 每個 commit 遵守專案 `git-commit` 技能格式 `<type>(<scope>): <subject> (#<issue_number>)`，並附 `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`。首個 commit 需帶 `AB#<id>`，執行前向使用者索取 issue 與 backlog 編號，以下以 `#1` 與 `AB#1` 為占位。
- 環境變數見規格；測試用 `DATABASE_URL_TEST`，沒有時 e2e 測試以 `describe.skipIf` 略過。

---

## File Structure

```
nuxt.config.ts
drizzle.config.ts
vitest.config.ts
.env.example
app/
  app.vue                      根：載入主題、layout
  assets/css/main.css          Tailwind + 色彩變數 + 字體
  layouts/default.vue          手機底部分頁 / 桌機側欄
  components/
    AppIcon.vue                描邊 SVG 圖示集合
    MoodPicker.vue             心情選擇列
    MonthCalendar.vue          月曆格
    JournalEditor.vue          Tiptap 編輯器 + 工具列 + 圖片上傳 + emoji
    TimelineCard.vue           時間軸卡片
    PhotoPlaceholder.vue       無圖時的插畫（僅用在時間軸無圖時不顯示；保留給空狀態插畫）
    EmptyEntry.vue             空狀態
    ConfirmDialog.vue          刪除確認
  composables/
    useTheme.ts                主題持久化
    useEntry.ts                單篇讀寫 + 自動儲存
    useMonth.ts                目前月份狀態
  pages/
    index.vue                  月曆首頁
    entry/[date].vue           編輯/空狀態
    timeline.vue
    stats.vue
    settings.vue
shared/
  date.ts                      日期工具（純函式）
  content.ts                   Tiptap JSON 摘要與首圖（純函式）
  stats.ts                     連續天數與心情計數（純函式）
  types.ts                     API 型別
server/
  db/schema.ts                 Drizzle schema
  db/client.ts                 連線
  utils/entries.ts             entries 資料存取
  utils/s3.ts                  S3 client 與上傳
  api/entries/index.get.ts
  server/api/entries/[date].get.ts
  server/api/entries/[date].put.ts
  server/api/entries/[date].delete.ts
  server/api/upload.post.ts
  server/api/stats.get.ts
  server/api/export.get.ts
drizzle/                       migration 輸出
tests/
  unit/date.test.ts
  unit/content.test.ts
  unit/stats.test.ts
  e2e/entries.test.ts
  e2e/stats.test.ts
public/
  icons/icon-192.png, icon-512.png
```

---

### Task 1: 專案骨架、Tailwind、vitest、git

**Files:**
- Create: `package.json`（由 nuxi 產生後修改）、`nuxt.config.ts`、`vitest.config.ts`、`app/assets/css/main.css`、`app/app.vue`、`.env.example`、`.gitignore`
- Test: `tests/unit/smoke.test.ts`

**Interfaces:**
- Produces: CSS 變數 `--paper --card --ink --ink2 --ink3 --line --accent --accent-soft --today --chip`，Tailwind 工具類 `bg-paper text-ink border-line` 等（透過 `@theme`）。

- [ ] **Step 1: 建立 Nuxt 專案**

```bash
cd C:/Users/ray.liu_smartdaily/source/repos/Node/Journal
npx nuxi@latest init . --package-manager npm --git-init false --force
npm install
```

若 nuxi 拒絕在非空目錄建立，先建立到 `tmp-init` 再把內容搬到根目錄（保留 `design/` 與 `docs/`）。

- [ ] **Step 2: 安裝依賴**

```bash
npm install tailwindcss @tailwindcss/vite @tiptap/vue-3 @tiptap/starter-kit @tiptap/extension-image @tiptap/extensions emoji-picker-element drizzle-orm postgres @aws-sdk/client-s3 @vite-pwa/nuxt
npm install -D drizzle-kit vitest @nuxt/test-utils @vue/test-utils happy-dom
```

- [ ] **Step 3: nuxt.config.ts**

```ts
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2026-09-01',
  devtools: { enabled: true },
  modules: ['@vite-pwa/nuxt'],
  css: ['~/assets/css/main.css'],
  vite: { plugins: [tailwindcss()] },
  vue: { compilerOptions: { isCustomElement: (tag) => tag === 'emoji-picker' } },
  app: {
    head: {
      htmlAttrs: { lang: 'zh-Hant-TW' },
      title: '紙頁日記',
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' }],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@500;700&family=Noto+Sans+TC:wght@400;500;700&display=swap' },
      ],
    },
  },
  runtimeConfig: {
    databaseUrl: '',
    s3: { endpoint: '', region: 'auto', bucket: '', accessKeyId: '', secretAccessKey: '', publicBaseUrl: '' },
  },
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: '紙頁日記', short_name: '日記', lang: 'zh-Hant-TW', display: 'standalone',
      start_url: '/', background_color: '#F4EDE0', theme_color: '#F4EDE0',
      icons: [
        { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
    },
    workbox: { navigateFallback: null, globPatterns: [] },
  },
})
```

Nuxt 會把 `NUXT_DATABASE_URL`、`NUXT_S3_ENDPOINT`、`NUXT_S3_BUCKET`、`NUXT_S3_ACCESS_KEY_ID`、`NUXT_S3_SECRET_ACCESS_KEY`、`NUXT_S3_PUBLIC_BASE_URL`、`NUXT_S3_REGION` 對應進 `runtimeConfig`。

- [ ] **Step 4: main.css（色票與字體）**

```css
@import "tailwindcss";

@theme {
  --color-paper: var(--paper);
  --color-card: var(--card);
  --color-ink: var(--ink);
  --color-ink2: var(--ink2);
  --color-ink3: var(--ink3);
  --color-line: var(--line);
  --color-accent: var(--accent);
  --color-accent-soft: var(--accent-soft);
  --color-today: var(--today);
  --color-chip: var(--chip);
  --font-sans: "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", sans-serif;
  --font-serif: "Noto Serif TC", "PingFang TC", "Songti TC", serif;
}

:root {
  --paper: #F4EDE0; --card: #FCF9F3; --ink: #2B231B; --ink2: #7A6C5D; --ink3: #A89A8A;
  --line: #E2D7C3; --accent: #B4552F; --accent-soft: #F3E1D3; --today: #EBCDA9; --chip: #EFE6D6;
  color-scheme: light;
}
html[data-theme="dark"] {
  --paper: #241B15; --card: #2F251E; --ink: #F2E9DB; --ink2: #B4A492; --ink3: #7E6F60;
  --line: #43362C; --accent: #DB8358; --accent-soft: #4A3325; --today: #5B4230; --chip: #3A2E25;
  color-scheme: dark;
}

html, body { background: var(--paper); color: var(--ink); font-family: var(--font-sans); -webkit-font-smoothing: antialiased; }
```

- [ ] **Step 5: app.vue**

```vue
<script setup lang="ts">
useTheme()
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
```

`useTheme` 在 Task 8 實作；此步先建立空殼 `app/composables/useTheme.ts`：

```ts
export function useTheme() {}
```

- [ ] **Step 6: vitest.config.ts 與 smoke 測試**

```ts
import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
})
```

`tests/unit/smoke.test.ts`：

```ts
import { describe, it, expect } from 'vitest'

describe('smoke', () => {
  it('runs', () => { expect(1 + 1).toBe(2) })
})
```

`package.json` scripts 加 `"test": "vitest run"`, `"db:generate": "drizzle-kit generate"`, `"db:migrate": "drizzle-kit migrate"`。

- [ ] **Step 7: 執行測試與 dev 啟動確認**

Run: `npm test`
Expected: 1 passed

Run: `npm run dev` 後以 curl 打 `http://localhost:3000` 得 200，再 Ctrl+C。

- [ ] **Step 8: .env.example 與 .gitignore**

`.env.example`：

```
NUXT_DATABASE_URL=postgres://user:pass@localhost:5432/journal
DATABASE_URL_TEST=postgres://user:pass@localhost:5432/journal_test
NUXT_S3_ENDPOINT=https://s3.example.com
NUXT_S3_REGION=auto
NUXT_S3_BUCKET=journal
NUXT_S3_ACCESS_KEY_ID=
NUXT_S3_SECRET_ACCESS_KEY=
NUXT_S3_PUBLIC_BASE_URL=https://s3.example.com/journal
```

`.gitignore` 確認含 `.env`、`node_modules`、`.nuxt`、`.output`。

- [ ] **Step 9: Commit**

```bash
git init
git add -A
git commit -m "chore(app): scaffold nuxt project with tailwind and vitest (#1) AB#1

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 2: 日期工具（shared/date.ts）

**Files:**
- Create: `shared/date.ts`
- Test: `tests/unit/date.test.ts`

**Interfaces:**
- Produces:
  - `isDateKey(s: string): boolean` — 合法 `YYYY-MM-DD` 且為真實日期
  - `isMonthKey(s: string): boolean` — 合法 `YYYY-MM`
  - `todayKey(now?: Date): string` — 本機時區今天
  - `monthOf(dateKey: string): string`
  - `monthRange(monthKey: string): { start: string; end: string }` — 該月首日與末日
  - `daysInMonth(monthKey: string): number`
  - `weekdayOf(dateKey: string): number` — 1=一 … 7=日
  - `formatTitle(dateKey: string): string` — 「九月十一日」
  - `formatWeekday(dateKey: string): string` — 「星期五」
  - `formatMonthTitle(monthKey: string): string` — 「二〇二六年 九月」
  - `shiftMonth(monthKey: string, delta: number): string`

- [ ] **Step 1: 寫失敗測試**

```ts
import { describe, it, expect } from 'vitest'
import {
  isDateKey, isMonthKey, todayKey, monthOf, monthRange, daysInMonth,
  weekdayOf, formatTitle, formatWeekday, formatMonthTitle, shiftMonth,
} from '../../shared/date'

describe('date keys', () => {
  it('validates date keys', () => {
    expect(isDateKey('2026-09-11')).toBe(true)
    expect(isDateKey('2026-02-30')).toBe(false)
    expect(isDateKey('2026-9-1')).toBe(false)
    expect(isDateKey('hello')).toBe(false)
  })
  it('validates month keys', () => {
    expect(isMonthKey('2026-09')).toBe(true)
    expect(isMonthKey('2026-13')).toBe(false)
    expect(isMonthKey('2026-9')).toBe(false)
  })
  it('todayKey uses local date', () => {
    expect(todayKey(new Date(2026, 8, 11, 23, 59))).toBe('2026-09-11')
  })
  it('monthOf / monthRange / daysInMonth', () => {
    expect(monthOf('2026-09-11')).toBe('2026-09')
    expect(monthRange('2026-09')).toEqual({ start: '2026-09-01', end: '2026-09-30' })
    expect(daysInMonth('2024-02')).toBe(29)
  })
  it('weekdayOf: Monday=1 … Sunday=7', () => {
    expect(weekdayOf('2026-09-11')).toBe(5)
    expect(weekdayOf('2026-09-13')).toBe(7)
  })
  it('shiftMonth wraps years', () => {
    expect(shiftMonth('2026-12', 1)).toBe('2027-01')
    expect(shiftMonth('2026-01', -1)).toBe('2025-12')
  })
})

describe('formatting', () => {
  it('formats titles in Traditional Chinese', () => {
    expect(formatTitle('2026-09-11')).toBe('九月十一日')
    expect(formatTitle('2026-10-20')).toBe('十月二十日')
    expect(formatTitle('2026-12-31')).toBe('十二月三十一日')
    expect(formatWeekday('2026-09-11')).toBe('星期五')
    expect(formatMonthTitle('2026-09')).toBe('二〇二六年 九月')
  })
})
```

- [ ] **Step 2: 執行確認失敗**

Run: `npx vitest run tests/unit/date.test.ts`
Expected: FAIL，找不到模組 `shared/date`

- [ ] **Step 3: 實作**

```ts
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/
const MONTH_RE = /^(\d{4})-(\d{2})$/
const DIGITS = ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九']
const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

const pad = (n: number) => String(n).padStart(2, '0')

export function isMonthKey(s: string): boolean {
  const m = MONTH_RE.exec(s)
  if (!m) return false
  const month = Number(m[2])
  return month >= 1 && month <= 12
}

export function isDateKey(s: string): boolean {
  const m = DATE_RE.exec(s)
  if (!m) return false
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])]
  if (mo < 1 || mo > 12 || d < 1) return false
  return d <= new Date(y, mo, 0).getDate()
}

export function todayKey(now: Date = new Date()): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

export function monthOf(dateKey: string): string {
  return dateKey.slice(0, 7)
}

export function daysInMonth(monthKey: string): number {
  const [y, m] = monthKey.split('-').map(Number)
  return new Date(y, m, 0).getDate()
}

export function monthRange(monthKey: string): { start: string; end: string } {
  return { start: `${monthKey}-01`, end: `${monthKey}-${pad(daysInMonth(monthKey))}` }
}

export function weekdayOf(dateKey: string): number {
  const [y, m, d] = dateKey.split('-').map(Number)
  const js = new Date(y, m - 1, d).getDay()
  return js === 0 ? 7 : js
}

export function shiftMonth(monthKey: string, delta: number): string {
  const [y, m] = monthKey.split('-').map(Number)
  const total = y * 12 + (m - 1) + delta
  return `${Math.floor(total / 12)}-${pad((total % 12) + 1)}`
}

function chineseNumber(n: number): string {
  if (n <= 10) return n === 10 ? '十' : DIGITS[n]
  if (n < 20) return `十${DIGITS[n % 10]}`
  const tens = Math.floor(n / 10)
  const ones = n % 10
  return `${DIGITS[tens]}十${ones ? DIGITS[ones] : ''}`
}

export function formatTitle(dateKey: string): string {
  const [, m, d] = dateKey.split('-').map(Number)
  return `${chineseNumber(m)}月${chineseNumber(d)}日`
}

export function formatWeekday(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  return `星期${WEEKDAYS[new Date(y, m - 1, d).getDay()]}`
}

export function formatMonthTitle(monthKey: string): string {
  const [y, m] = monthKey.split('-')
  const year = [...y].map((c) => DIGITS[Number(c)]).join('')
  return `${year}年 ${chineseNumber(Number(m))}月`
}
```

- [ ] **Step 4: 執行確認通過**

Run: `npx vitest run tests/unit/date.test.ts`
Expected: 7 passed

- [ ] **Step 5: Commit**

```bash
git add shared/date.ts tests/unit/date.test.ts
git commit -m "feat(shared): add date key helpers and chinese formatting (#1)

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3: 內容摘要與統計純函式（shared/content.ts、shared/stats.ts、shared/types.ts）

**Files:**
- Create: `shared/content.ts`、`shared/stats.ts`、`shared/types.ts`
- Test: `tests/unit/content.test.ts`、`tests/unit/stats.test.ts`

**Interfaces:**
- Produces:
  - `type TiptapDoc = { type: 'doc'; content?: TiptapNode[] }`、`type TiptapNode = { type: string; text?: string; attrs?: Record<string, unknown>; content?: TiptapNode[] }`
  - `emptyDoc(): TiptapDoc`
  - `excerptOf(doc: TiptapDoc, max = 80): string` — 純文字前 N 字
  - `firstImageUrl(doc: TiptapDoc): string | null`
  - `isEmptyDoc(doc: TiptapDoc): boolean`
  - `type EntrySummary = { date: string; mood: string | null; excerpt: string; firstImageUrl: string | null }`
  - `type Entry = { date: string; mood: string | null; content: TiptapDoc; updatedAt: string }`
  - `type Stats = { daysWritten: number; streak: number; moods: { mood: string; count: number }[]; uploads: number }`
  - `streakEndingAt(dates: string[], today: string): number` — 以 today 往前連續天數（today 未寫則從昨天算）
  - `moodCounts(moods: (string | null)[]): { mood: string; count: number }[]` — 由多到少

- [ ] **Step 1: 寫失敗測試**

`tests/unit/content.test.ts`：

```ts
import { describe, it, expect } from 'vitest'
import { emptyDoc, excerptOf, firstImageUrl, isEmptyDoc, type TiptapDoc } from '../../shared/content'

const doc: TiptapDoc = {
  type: 'doc',
  content: [
    { type: 'paragraph', content: [{ type: 'text', text: '早上七點就醒了，' }, { type: 'text', text: '窗外的光線很柔。' }] },
    { type: 'image', attrs: { src: 'https://cdn/a.jpg' } },
    { type: 'paragraph', content: [{ type: 'text', text: '第二段。' }] },
    { type: 'image', attrs: { src: 'https://cdn/b.jpg' } },
  ],
}

describe('content helpers', () => {
  it('emptyDoc is empty', () => {
    expect(isEmptyDoc(emptyDoc())).toBe(true)
    expect(isEmptyDoc({ type: 'doc', content: [{ type: 'paragraph' }] })).toBe(true)
    expect(isEmptyDoc(doc)).toBe(false)
  })
  it('excerpt joins paragraphs with a space and truncates', () => {
    expect(excerptOf(doc)).toBe('早上七點就醒了，窗外的光線很柔。 第二段。')
    expect(excerptOf(doc, 5)).toBe('早上七點就…')
  })
  it('finds the first image', () => {
    expect(firstImageUrl(doc)).toBe('https://cdn/a.jpg')
    expect(firstImageUrl(emptyDoc())).toBeNull()
  })
})
```

`tests/unit/stats.test.ts`：

```ts
import { describe, it, expect } from 'vitest'
import { streakEndingAt, moodCounts } from '../../shared/stats'

describe('streakEndingAt', () => {
  it('counts consecutive days ending today', () => {
    expect(streakEndingAt(['2026-09-09', '2026-09-10', '2026-09-11'], '2026-09-11')).toBe(3)
  })
  it('starts from yesterday when today is not written yet', () => {
    expect(streakEndingAt(['2026-09-09', '2026-09-10'], '2026-09-11')).toBe(2)
  })
  it('breaks on a gap and crosses month boundaries', () => {
    expect(streakEndingAt(['2026-08-31', '2026-09-01', '2026-09-03'], '2026-09-03')).toBe(1)
    expect(streakEndingAt(['2026-08-31', '2026-09-01'], '2026-09-01')).toBe(2)
    expect(streakEndingAt([], '2026-09-01')).toBe(0)
  })
})

describe('moodCounts', () => {
  it('counts and sorts descending, ignoring null', () => {
    expect(moodCounts(['😊', null, '😌', '😊'])).toEqual([
      { mood: '😊', count: 2 }, { mood: '😌', count: 1 },
    ])
  })
})
```

- [ ] **Step 2: 執行確認失敗**

Run: `npx vitest run tests/unit/content.test.ts tests/unit/stats.test.ts`
Expected: FAIL，找不到模組

- [ ] **Step 3: 實作**

`shared/types.ts`：

```ts
export type TiptapNode = {
  type: string
  text?: string
  attrs?: Record<string, unknown>
  content?: TiptapNode[]
}
export type TiptapDoc = { type: 'doc'; content?: TiptapNode[] }

export type EntrySummary = { date: string; mood: string | null; excerpt: string; firstImageUrl: string | null }
export type Entry = { date: string; mood: string | null; content: TiptapDoc; updatedAt: string }
export type Stats = { daysWritten: number; streak: number; moods: { mood: string; count: number }[]; uploads: number }
```

`shared/content.ts`：

```ts
import type { TiptapDoc, TiptapNode } from './types'
export type { TiptapDoc, TiptapNode } from './types'

export function emptyDoc(): TiptapDoc {
  return { type: 'doc', content: [] }
}

function* walk(nodes: TiptapNode[] | undefined): Generator<TiptapNode> {
  for (const n of nodes ?? []) {
    yield n
    yield* walk(n.content)
  }
}

function blockTexts(doc: TiptapDoc): string[] {
  const out: string[] = []
  for (const block of doc.content ?? []) {
    const text = [...walk(block.content)].filter((n) => n.type === 'text').map((n) => n.text ?? '').join('')
    if (text.trim()) out.push(text)
  }
  return out
}

export function isEmptyDoc(doc: TiptapDoc): boolean {
  if (blockTexts(doc).length) return false
  return ![...walk(doc.content)].some((n) => n.type === 'image')
}

export function excerptOf(doc: TiptapDoc, max = 80): string {
  const text = blockTexts(doc).join(' ')
  const chars = [...text]
  return chars.length > max ? `${chars.slice(0, max).join('')}…` : text
}

export function firstImageUrl(doc: TiptapDoc): string | null {
  for (const n of walk(doc.content)) {
    if (n.type === 'image' && typeof n.attrs?.src === 'string') return n.attrs.src
  }
  return null
}
```

`shared/stats.ts`：

```ts
function addDays(dateKey: string, delta: number): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  const dt = new Date(y, m - 1, d + delta)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`
}

export function streakEndingAt(dates: string[], today: string): number {
  const set = new Set(dates)
  let cursor = set.has(today) ? today : addDays(today, -1)
  let count = 0
  while (set.has(cursor)) {
    count++
    cursor = addDays(cursor, -1)
  }
  return count
}

export function moodCounts(moods: (string | null)[]): { mood: string; count: number }[] {
  const map = new Map<string, number>()
  for (const m of moods) if (m) map.set(m, (map.get(m) ?? 0) + 1)
  return [...map].map(([mood, count]) => ({ mood, count })).sort((a, b) => b.count - a.count)
}
```

- [ ] **Step 4: 執行確認通過**

Run: `npx vitest run tests/unit`
Expected: 全部通過

- [ ] **Step 5: Commit**

```bash
git add shared tests/unit
git commit -m "feat(shared): add content excerpt and streak helpers (#1)

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 4: Drizzle schema、連線與 migration

**Files:**
- Create: `server/db/schema.ts`、`server/db/client.ts`、`drizzle.config.ts`、`drizzle/`（產生）

**Interfaces:**
- Produces:
  - `entries` table：`date` (date, PK)、`mood` (text nullable)、`content` (jsonb, `TiptapDoc`)、`createdAt`、`updatedAt`
  - `images` table：`id` (uuid PK)、`key` (text unique)、`url` (text)、`entryDate` (date nullable FK)、`createdAt`
  - `useDb(): PostgresJsDatabase<typeof schema>` — 由 `server/db/client.ts` 匯出，Nitro 自動 import 不涵蓋 `server/db`，故各 handler 以 `import { useDb } from '../../db/client'` 明確引入

- [ ] **Step 1: schema**

```ts
import { pgTable, date, text, jsonb, timestamp, uuid } from 'drizzle-orm/pg-core'
import type { TiptapDoc } from '../../shared/types'

export const entries = pgTable('entries', {
  date: date('date').primaryKey(),
  mood: text('mood'),
  content: jsonb('content').$type<TiptapDoc>().notNull().default({ type: 'doc', content: [] }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const images = pgTable('images', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: text('key').notNull().unique(),
  url: text('url').notNull(),
  entryDate: date('entry_date').references(() => entries.date, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
```

- [ ] **Step 2: client**

```ts
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

let db: PostgresJsDatabase<typeof schema> | undefined

export function useDb(): PostgresJsDatabase<typeof schema> {
  if (!db) {
    const url = useRuntimeConfig().databaseUrl
    if (!url) throw new Error('NUXT_DATABASE_URL is not set')
    db = drizzle(postgres(url, { max: 5 }), { schema })
  }
  return db
}
```

- [ ] **Step 3: drizzle.config.ts**

```ts
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'postgresql',
  schema: './server/db/schema.ts',
  out: './drizzle',
  dbCredentials: { url: process.env.NUXT_DATABASE_URL! },
})
```

- [ ] **Step 4: 產生並套用 migration**

在 `.env` 填好 `NUXT_DATABASE_URL`（向使用者索取實際連線字串，資料庫 `journal` 需先存在），然後：

```bash
npm run db:generate
npm run db:migrate
```

Expected: `drizzle/0000_*.sql` 產生，且資料庫出現 `entries`、`images` 兩表。若同時提供 `DATABASE_URL_TEST`，也對測試庫套用：`NUXT_DATABASE_URL=$DATABASE_URL_TEST npm run db:migrate`。

- [ ] **Step 5: Commit**

```bash
git add server/db drizzle drizzle.config.ts
git commit -m "feat(db): add entries and images schema with drizzle migrations (#1)

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 5: Entries 資料存取與 REST API

**Files:**
- Create: `server/utils/entries.ts`、`server/api/entries/index.get.ts`、`server/api/entries/[date].get.ts`、`server/api/entries/[date].put.ts`、`server/api/entries/[date].delete.ts`
- Test: `tests/e2e/entries.test.ts`

**Interfaces:**
- Consumes: `useDb`、`entries` schema、`isDateKey`、`isMonthKey`、`monthRange`、`excerptOf`、`firstImageUrl`、`isEmptyDoc`
- Produces（`server/utils/entries.ts`，Nitro 自動 import）:
  - `listEntrySummaries(month: string): Promise<EntrySummary[]>`
  - `getEntry(date: string): Promise<Entry | null>`
  - `upsertEntry(date: string, patch: { mood?: string | null; content?: TiptapDoc }): Promise<Entry>`
  - `deleteEntry(date: string): Promise<boolean>`
  - `listEntryDates(month: string): Promise<{ date: string; mood: string | null }[]>`（給 stats 用）

- [ ] **Step 1: 寫失敗 e2e 測試**

```ts
import { describe, it, expect, beforeAll } from 'vitest'
import { setup, $fetch, fetch } from '@nuxt/test-utils/e2e'

const url = process.env.DATABASE_URL_TEST

describe.skipIf(!url)('entries api', async () => {
  await setup({ env: { NUXT_DATABASE_URL: url! } })

  const date = '2026-09-11'

  beforeAll(async () => {
    await fetch(`/api/entries/${date}`, { method: 'DELETE' })
  })

  it('returns 404 for a missing entry', async () => {
    const res = await fetch(`/api/entries/${date}`)
    expect(res.status).toBe(404)
  })

  it('rejects an invalid date key', async () => {
    const res = await fetch('/api/entries/2026-02-30')
    expect(res.status).toBe(400)
  })

  it('upserts and reads back', async () => {
    const created = await $fetch(`/api/entries/${date}`, {
      method: 'PUT',
      body: { mood: '😊', content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '早安' }] }] } },
    })
    expect(created.date).toBe(date)
    expect(created.mood).toBe('😊')

    const updated = await $fetch(`/api/entries/${date}`, { method: 'PUT', body: { mood: '😌' } })
    expect(updated.mood).toBe('😌')
    expect(updated.content.content[0].content[0].text).toBe('早安')
  })

  it('lists the month with excerpt', async () => {
    const list = await $fetch('/api/entries', { query: { month: '2026-09' } })
    const hit = list.find((e: { date: string }) => e.date === date)
    expect(hit).toMatchObject({ date, mood: '😌', excerpt: '早安', firstImageUrl: null })
  })

  it('rejects a bad month', async () => {
    const res = await fetch('/api/entries?month=2026-13')
    expect(res.status).toBe(400)
  })

  it('deletes', async () => {
    const res = await fetch(`/api/entries/${date}`, { method: 'DELETE' })
    expect(res.status).toBe(204)
    expect((await fetch(`/api/entries/${date}`)).status).toBe(404)
  })
})
```

- [ ] **Step 2: 執行確認失敗**

Run: `DATABASE_URL_TEST=<測試庫> npx vitest run tests/e2e/entries.test.ts`
Expected: FAIL（404 以外的狀態或路由不存在）。無測試庫時整組 skip，改以手動 curl 驗證 Step 5。

- [ ] **Step 3: 實作 server/utils/entries.ts**

```ts
import { and, desc, eq, gte, lte } from 'drizzle-orm'
import { useDb } from '../db/client'
import { entries } from '../db/schema'
import { monthRange } from '../../shared/date'
import { excerptOf, firstImageUrl } from '../../shared/content'
import type { Entry, EntrySummary, TiptapDoc } from '../../shared/types'

function toEntry(row: typeof entries.$inferSelect): Entry {
  return { date: row.date, mood: row.mood, content: row.content, updatedAt: row.updatedAt.toISOString() }
}

export async function listEntrySummaries(month: string): Promise<EntrySummary[]> {
  const { start, end } = monthRange(month)
  const rows = await useDb().select().from(entries)
    .where(and(gte(entries.date, start), lte(entries.date, end)))
    .orderBy(desc(entries.date))
  return rows.map((r) => ({ date: r.date, mood: r.mood, excerpt: excerptOf(r.content), firstImageUrl: firstImageUrl(r.content) }))
}

export async function listEntryDates(month: string): Promise<{ date: string; mood: string | null }[]> {
  const { start, end } = monthRange(month)
  return useDb().select({ date: entries.date, mood: entries.mood }).from(entries)
    .where(and(gte(entries.date, start), lte(entries.date, end)))
}

export async function getEntry(date: string): Promise<Entry | null> {
  const [row] = await useDb().select().from(entries).where(eq(entries.date, date)).limit(1)
  return row ? toEntry(row) : null
}

export async function upsertEntry(date: string, patch: { mood?: string | null; content?: TiptapDoc }): Promise<Entry> {
  const values: Partial<typeof entries.$inferInsert> = { updatedAt: new Date() }
  if (patch.mood !== undefined) values.mood = patch.mood
  if (patch.content !== undefined) values.content = patch.content
  const [row] = await useDb().insert(entries)
    .values({ date, ...values })
    .onConflictDoUpdate({ target: entries.date, set: values })
    .returning()
  return toEntry(row)
}

export async function deleteEntry(date: string): Promise<boolean> {
  const rows = await useDb().delete(entries).where(eq(entries.date, date)).returning({ date: entries.date })
  return rows.length > 0
}
```

- [ ] **Step 4: 實作四個 handler**

`server/api/entries/index.get.ts`：

```ts
import { isMonthKey, todayKey, monthOf } from '../../../shared/date'

export default defineEventHandler(async (event) => {
  const month = (getQuery(event).month as string | undefined) ?? monthOf(todayKey())
  if (!isMonthKey(month)) throw createError({ statusCode: 400, statusMessage: 'month 格式須為 YYYY-MM' })
  return listEntrySummaries(month)
})
```

`server/api/entries/[date].get.ts`：

```ts
import { isDateKey } from '../../../shared/date'

export default defineEventHandler(async (event) => {
  const date = getRouterParam(event, 'date')!
  if (!isDateKey(date)) throw createError({ statusCode: 400, statusMessage: 'date 格式須為 YYYY-MM-DD' })
  const entry = await getEntry(date)
  if (!entry) throw createError({ statusCode: 404, statusMessage: '這一天還沒有日記' })
  return entry
})
```

`server/api/entries/[date].put.ts`：

```ts
import { isDateKey } from '../../../shared/date'
import type { TiptapDoc } from '../../../shared/types'

export default defineEventHandler(async (event) => {
  const date = getRouterParam(event, 'date')!
  if (!isDateKey(date)) throw createError({ statusCode: 400, statusMessage: 'date 格式須為 YYYY-MM-DD' })
  const body = await readBody<{ mood?: unknown; content?: unknown }>(event)
  const patch: { mood?: string | null; content?: TiptapDoc } = {}
  if ('mood' in body) {
    if (body.mood !== null && (typeof body.mood !== 'string' || [...body.mood].length > 4)) {
      throw createError({ statusCode: 400, statusMessage: 'mood 須為單一 emoji 或 null' })
    }
    patch.mood = body.mood as string | null
  }
  if ('content' in body) {
    const c = body.content as TiptapDoc
    if (!c || c.type !== 'doc') throw createError({ statusCode: 400, statusMessage: 'content 須為 Tiptap doc' })
    patch.content = c
  }
  return upsertEntry(date, patch)
})
```

`server/api/entries/[date].delete.ts`：

```ts
import { isDateKey } from '../../../shared/date'

export default defineEventHandler(async (event) => {
  const date = getRouterParam(event, 'date')!
  if (!isDateKey(date)) throw createError({ statusCode: 400, statusMessage: 'date 格式須為 YYYY-MM-DD' })
  await deleteEntry(date)
  setResponseStatus(event, 204)
  return null
})
```

- [ ] **Step 5: 執行確認通過**

Run: `DATABASE_URL_TEST=<測試庫> npx vitest run tests/e2e/entries.test.ts`
Expected: 6 passed

若無測試庫：`npm run dev` 後

```bash
curl -s -X PUT localhost:3000/api/entries/2026-09-11 -H 'content-type: application/json' -d '{"mood":"😊"}'
curl -s "localhost:3000/api/entries?month=2026-09"
curl -s -o /dev/null -w '%{http_code}' -X DELETE localhost:3000/api/entries/2026-09-11
```

Expected: JSON 回傳、清單含該日、204。

- [ ] **Step 6: Commit**

```bash
git add server/utils/entries.ts server/api/entries tests/e2e/entries.test.ts
git commit -m "feat(api): add entries crud endpoints (#1)

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 6: S3 上傳 API

**Files:**
- Create: `server/utils/s3.ts`、`server/api/upload.post.ts`
- Test: `tests/unit/s3-key.test.ts`

**Interfaces:**
- Produces:
  - `objectKeyFor(date: string | null, filename: string, now?: Date, rand?: string): string` — `entries/2026-09-11/1757570000000-ab12cd.jpg` 或 `misc/…`；副檔名小寫、只留 `[a-z0-9]`
  - `uploadImage(buffer: Buffer, key: string, contentType: string): Promise<string>` — 回公開 URL
  - `POST /api/upload` → `{ url: string; key: string }`

- [ ] **Step 1: 寫失敗測試（純函式部分）**

```ts
import { describe, it, expect } from 'vitest'
import { objectKeyFor } from '../../server/utils/s3'

describe('objectKeyFor', () => {
  it('builds a key under the entry date', () => {
    expect(objectKeyFor('2026-09-11', 'IMG_001.JPG', new Date(1757570000000), 'ab12cd'))
      .toBe('entries/2026-09-11/1757570000000-ab12cd.jpg')
  })
  it('falls back to misc and strips odd extensions', () => {
    expect(objectKeyFor(null, 'weird.name.p*n?g', new Date(1), 'x')).toBe('misc/1-x.png')
    expect(objectKeyFor(null, 'noext', new Date(1), 'x')).toBe('misc/1-x.bin')
  })
})
```

- [ ] **Step 2: 執行確認失敗**

Run: `npx vitest run tests/unit/s3-key.test.ts`
Expected: FAIL，找不到模組

- [ ] **Step 3: 實作 server/utils/s3.ts**

```ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { randomBytes } from 'node:crypto'

export function objectKeyFor(date: string | null, filename: string, now: Date = new Date(), rand = randomBytes(3).toString('hex')): string {
  const dot = filename.lastIndexOf('.')
  const raw = dot >= 0 ? filename.slice(dot + 1) : ''
  const ext = raw.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin'
  const folder = date ? `entries/${date}` : 'misc'
  return `${folder}/${now.getTime()}-${rand}.${ext}`
}

let client: S3Client | undefined

function useS3() {
  const cfg = useRuntimeConfig().s3
  if (!cfg.bucket || !cfg.accessKeyId) throw createError({ statusCode: 503, statusMessage: '尚未設定圖片儲存空間' })
  client ??= new S3Client({
    region: cfg.region || 'auto',
    endpoint: cfg.endpoint || undefined,
    forcePathStyle: true,
    credentials: { accessKeyId: cfg.accessKeyId, secretAccessKey: cfg.secretAccessKey },
  })
  return { client, cfg }
}

export async function uploadImage(buffer: Buffer, key: string, contentType: string): Promise<string> {
  const { client, cfg } = useS3()
  await client.send(new PutObjectCommand({ Bucket: cfg.bucket, Key: key, Body: buffer, ContentType: contentType }))
  return `${cfg.publicBaseUrl.replace(/\/$/, '')}/${key}`
}
```

- [ ] **Step 4: 實作 server/api/upload.post.ts**

```ts
import { isDateKey } from '../../shared/date'
import { useDb } from '../db/client'
import { images } from '../db/schema'

const MAX_BYTES = 10 * 1024 * 1024

export default defineEventHandler(async (event) => {
  const parts = await readMultipartFormData(event)
  const file = parts?.find((p) => p.name === 'file')
  const dateRaw = parts?.find((p) => p.name === 'date')?.data.toString()
  if (!file?.data?.length) throw createError({ statusCode: 400, statusMessage: '缺少檔案' })
  if (!file.type?.startsWith('image/')) throw createError({ statusCode: 415, statusMessage: '只接受圖片' })
  if (file.data.length > MAX_BYTES) throw createError({ statusCode: 413, statusMessage: '圖片不可超過 10MB' })
  const date = dateRaw && isDateKey(dateRaw) ? dateRaw : null

  const key = objectKeyFor(date, file.filename ?? 'image')
  const url = await uploadImage(file.data, key, file.type)
  const entryExists = date ? Boolean(await getEntry(date)) : false
  await useDb().insert(images).values({ key, url, entryDate: entryExists ? date : null })
  return { url, key }
})
```

- [ ] **Step 5: 執行確認通過與手動上傳**

Run: `npx vitest run tests/unit/s3-key.test.ts`
Expected: 2 passed

填好 `.env` 的 S3 變數後：

```bash
curl -s -F "file=@design/paper-journal.html;type=image/png" localhost:3000/api/upload
```

Expected: 回 `{url, key}`，且以瀏覽器開 url 能取得物件（內容不重要，只驗證通路）。刪掉那個測試物件。

- [ ] **Step 6: Commit**

```bash
git add server/utils/s3.ts server/api/upload.post.ts tests/unit/s3-key.test.ts
git commit -m "feat(api): add s3 image upload endpoint (#1)

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 7: Stats 與 Export API

**Files:**
- Create: `server/api/stats.get.ts`、`server/api/export.get.ts`
- Test: `tests/e2e/stats.test.ts`

**Interfaces:**
- Consumes: `listEntryDates`、`streakEndingAt`、`moodCounts`、`images`
- Produces: `GET /api/stats?month=` → `Stats`；`GET /api/export` → `Entry[]`

- [ ] **Step 1: 寫失敗 e2e 測試**

```ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { setup, $fetch, fetch } from '@nuxt/test-utils/e2e'

const url = process.env.DATABASE_URL_TEST

describe.skipIf(!url)('stats api', async () => {
  await setup({ env: { NUXT_DATABASE_URL: url! } })
  const dates = ['2031-03-01', '2031-03-02', '2031-03-05']

  beforeAll(async () => {
    for (const [i, d] of dates.entries()) {
      await $fetch(`/api/entries/${d}`, { method: 'PUT', body: { mood: i === 2 ? '😌' : '😊' } })
    }
  })
  afterAll(async () => {
    for (const d of dates) await fetch(`/api/entries/${d}`, { method: 'DELETE' })
  })

  it('counts days and moods for the month', async () => {
    const s = await $fetch('/api/stats', { query: { month: '2031-03' } })
    expect(s.daysWritten).toBe(3)
    expect(s.moods).toEqual([{ mood: '😊', count: 2 }, { mood: '😌', count: 1 }])
    expect(typeof s.streak).toBe('number')
    expect(typeof s.uploads).toBe('number')
  })

  it('exports every entry', async () => {
    const all = await $fetch('/api/export')
    expect(all.map((e: { date: string }) => e.date)).toEqual(expect.arrayContaining(dates))
  })
})
```

- [ ] **Step 2: 執行確認失敗**

Run: `DATABASE_URL_TEST=<測試庫> npx vitest run tests/e2e/stats.test.ts`
Expected: FAIL（404）

- [ ] **Step 3: 實作**

`server/api/stats.get.ts`：

```ts
import { and, count, gte, lte, desc } from 'drizzle-orm'
import { isMonthKey, todayKey, monthOf, monthRange } from '../../shared/date'
import { streakEndingAt, moodCounts } from '../../shared/stats'
import { useDb } from '../db/client'
import { entries, images } from '../db/schema'
import type { Stats } from '../../shared/types'

export default defineEventHandler(async (event): Promise<Stats> => {
  const today = todayKey()
  const month = (getQuery(event).month as string | undefined) ?? monthOf(today)
  if (!isMonthKey(month)) throw createError({ statusCode: 400, statusMessage: 'month 格式須為 YYYY-MM' })

  const rows = await listEntryDates(month)
  const recent = await useDb().select({ date: entries.date }).from(entries)
    .where(lte(entries.date, today)).orderBy(desc(entries.date)).limit(400)
  const { start, end } = monthRange(month)
  const [{ uploads }] = await useDb().select({ uploads: count() }).from(images)
    .where(and(gte(images.createdAt, new Date(`${start}T00:00:00`)), lte(images.createdAt, new Date(`${end}T23:59:59.999`))))

  return {
    daysWritten: rows.length,
    streak: streakEndingAt(recent.map((r) => r.date), today),
    moods: moodCounts(rows.map((r) => r.mood)),
    uploads: Number(uploads),
  }
})
```

`server/api/export.get.ts`：

```ts
import { asc } from 'drizzle-orm'
import { useDb } from '../db/client'
import { entries } from '../db/schema'

export default defineEventHandler(async (event) => {
  const rows = await useDb().select().from(entries).orderBy(asc(entries.date))
  setHeader(event, 'content-disposition', 'attachment; filename="journal-export.json"')
  return rows.map((r) => ({ date: r.date, mood: r.mood, content: r.content, updatedAt: r.updatedAt.toISOString() }))
})
```

- [ ] **Step 4: 執行確認通過**

Run: `DATABASE_URL_TEST=<測試庫> npx vitest run tests/e2e`
Expected: 全部通過

- [ ] **Step 5: Commit**

```bash
git add server/api/stats.get.ts server/api/export.get.ts tests/e2e/stats.test.ts
git commit -m "feat(api): add monthly stats and json export (#1)

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 8: App 外殼：主題、圖示、layout（手機底部分頁 / 桌機側欄）

**Files:**
- Create: `app/composables/useTheme.ts`（取代空殼）、`app/components/AppIcon.vue`、`app/layouts/default.vue`、`app/composables/useMonth.ts`
- Modify: `app/app.vue`

**Interfaces:**
- Produces:
  - `useTheme(): { theme: Ref<'light'|'dark'|'system'>; setTheme(t): void }` — 存 localStorage `journal-theme`，套到 `html[data-theme]`
  - `<AppIcon name="calendar|timeline|stats|settings|back|more|prev|next|image|smile|bold|italic|heading|list|quote|pen|chevron|moon|cloud|download|trash|search" :size="22" />`
  - `useMonth(): { month: Ref<string>; prev(): void; next(): void; today(): void }` — 以 `useState('month')` 共享

- [ ] **Step 1: useTheme**

```ts
export type Theme = 'light' | 'dark' | 'system'
const KEY = 'journal-theme'

export function useTheme() {
  const theme = useState<Theme>('theme', () => 'system')

  function apply(t: Theme) {
    if (!import.meta.client) return
    const dark = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  }

  function setTheme(t: Theme) {
    theme.value = t
    try { localStorage.setItem(KEY, t) } catch {}
    apply(t)
  }

  onMounted(() => {
    try { theme.value = (localStorage.getItem(KEY) as Theme) || 'system' } catch {}
    apply(theme.value)
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => apply(theme.value))
  })

  return { theme, setTheme }
}
```

- [ ] **Step 2: AppIcon.vue**

```vue
<script setup lang="ts">
const props = withDefaults(defineProps<{ name: string; size?: number }>(), { size: 22 })
const paths: Record<string, string> = {
  calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  timeline: '<path d="M4 6h16M4 12h10M4 18h13"/>',
  stats: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  more: '<circle cx="5" cy="12" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><circle cx="19" cy="12" r="1.3" fill="currentColor"/>',
  prev: '<path d="M14 6l-6 6 6 6"/>',
  next: '<path d="M10 6l6 6-6 6"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="1.6"/><path d="M21 16l-5-5-9 9"/>',
  smile: '<circle cx="12" cy="12" r="9"/><path d="M8.5 14.5c1 1.2 2.2 1.8 3.5 1.8s2.5-.6 3.5-1.8"/><path d="M9 9.5h.01M15 9.5h.01" stroke-width="2.4"/>',
  bold: '<path d="M7 5h6a3.5 3.5 0 0 1 0 7H7zM7 12h7a3.5 3.5 0 0 1 0 7H7z"/>',
  italic: '<path d="M10 5h8M6 19h8M14 5l-4 14"/>',
  heading: '<path d="M5 5v14M13 5v14M5 12h8M17 12l2-1.5V19"/>',
  list: '<path d="M9 6h12M9 12h12M9 18h12"/><circle cx="4.5" cy="6" r="1" fill="currentColor"/><circle cx="4.5" cy="12" r="1" fill="currentColor"/><circle cx="4.5" cy="18" r="1" fill="currentColor"/>',
  quote: '<path d="M7 7h4v5H7zM13 7h4v5h-4zM7 12c0 3-1 4-3 5M13 12c0 3-1 4-3 5"/>',
  pen: '<path d="M4 20l4-1 10.5-10.5a2 2 0 0 0-3-3L5 16z"/><path d="M13 7l3 3"/>',
  chevron: '<path d="M9 6l6 6-6 6"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
  cloud: '<path d="M7 18h10a4 4 0 0 0 .5-8A6 6 0 0 0 6 11a3.5 3.5 0 0 0 1 7z"/>',
  download: '<path d="M12 4v11M7 10l5 5 5-5M4 20h16"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4-4"/>',
}
</script>

<template>
  <svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" v-html="paths[name]" />
</template>
```

- [ ] **Step 3: useMonth**

```ts
import { monthOf, shiftMonth, todayKey } from '../../shared/date'

export function useMonth() {
  const month = useState('month', () => monthOf(todayKey()))
  return {
    month,
    prev: () => { month.value = shiftMonth(month.value, -1) },
    next: () => { month.value = shiftMonth(month.value, 1) },
    today: () => { month.value = monthOf(todayKey()) },
  }
}
```

- [ ] **Step 4: layouts/default.vue**

```vue
<script setup lang="ts">
import { todayKey } from '../../shared/date'
const route = useRoute()
const items = [
  { to: '/', icon: 'calendar', label: '月曆' },
  { to: '/timeline', icon: 'timeline', label: '時間軸' },
  { to: '/stats', icon: 'stats', label: '統計' },
  { to: '/settings', icon: 'settings', label: '設定' },
]
const isActive = (to: string) => (to === '/' ? route.path === '/' || route.path.startsWith('/entry') : route.path.startsWith(to))
const hideMobileNav = computed(() => route.path.startsWith('/entry'))
</script>

<template>
  <div class="min-h-dvh flex bg-paper text-ink">
    <!-- 桌機側欄 -->
    <aside class="hidden lg:flex w-[232px] shrink-0 flex-col gap-7 border-r border-line bg-card px-5 py-8 sticky top-0 h-dvh">
      <div class="flex flex-col gap-0.5 px-2.5">
        <span class="font-serif text-xl font-bold">日記</span>
        <span class="text-xs text-ink3">一天，一頁</span>
      </div>
      <nav class="flex flex-col gap-1">
        <NuxtLink v-for="it in items" :key="it.to" :to="it.to"
          class="flex h-11 items-center gap-3 rounded-[10px] px-3 text-sm"
          :class="isActive(it.to) ? 'bg-accent-soft text-accent font-bold' : 'text-ink2'">
          <AppIcon :name="it.icon" :size="20" /><span :class="isActive(it.to) ? 'text-accent' : 'text-ink'">{{ it.label }}</span>
        </NuxtLink>
      </nav>
      <div class="grow" />
      <NuxtLink :to="`/entry/${todayKey()}`" class="flex h-11 items-center gap-3 rounded-[10px] bg-accent px-3 text-sm font-bold text-[#FFF7EE]">
        <AppIcon name="pen" :size="18" /><span>寫今天的日記</span>
      </NuxtLink>
    </aside>

    <div class="flex min-w-0 grow flex-col">
      <main class="grow" :class="hideMobileNav ? '' : 'pb-24 lg:pb-0'">
        <slot />
      </main>
      <!-- 手機底部分頁 -->
      <nav v-if="!hideMobileNav" class="fixed inset-x-0 bottom-0 flex items-center justify-around border-t border-line bg-card px-2 pt-2.5 pb-[max(1.5rem,env(safe-area-inset-bottom))] lg:hidden">
        <NuxtLink v-for="it in items" :key="it.to" :to="it.to"
          class="flex min-h-11 min-w-16 flex-col items-center justify-center gap-0.5"
          :class="isActive(it.to) ? 'text-accent' : 'text-ink3'">
          <AppIcon :name="it.icon" :size="22" />
          <span class="text-[11px]" :class="isActive(it.to) ? 'font-bold' : 'font-medium'">{{ it.label }}</span>
        </NuxtLink>
      </nav>
    </div>
  </div>
</template>
```

- [ ] **Step 5: 暫時的頁面殼與視覺確認**

建立四個最小頁面 `app/pages/index.vue`、`timeline.vue`、`stats.vue`、`settings.vue`，各只含 `<template><div class="p-5">月曆</div></template>` 之類的標題，然後 `npm run dev`，用瀏覽器（或 playwright）以 390 與 1440 寬各截一張圖，確認底部分頁與側欄的位置、色彩與設計稿一致，深色模式在 devtools 把 `html[data-theme="dark"]` 設上後色彩正確。

- [ ] **Step 6: Commit**

```bash
git add app
git commit -m "feat(app): add theme, icon set and responsive shell layout (#1)

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 9: 月曆元件與首頁

**Files:**
- Create: `app/components/MonthCalendar.vue`、`app/pages/index.vue`（取代殼）

**Interfaces:**
- Consumes: `GET /api/entries?month=`、`useMonth`、`daysInMonth`、`weekdayOf`、`formatMonthTitle`、`todayKey`
- Produces: `<MonthCalendar :month :moods :today :size="'sm'|'md'|'lg'" @select="(date) => …" />`，`moods: Record<string, string|null>`

- [ ] **Step 1: MonthCalendar.vue**

```vue
<script setup lang="ts">
import { daysInMonth, weekdayOf } from '../../shared/date'
const props = withDefaults(defineProps<{ month: string; moods: Record<string, string | null>; today: string; size?: 'sm' | 'md' | 'lg' }>(), { size: 'md' })
const emit = defineEmits<{ select: [date: string] }>()
const WEEK = ['一', '二', '三', '四', '五', '六', '日']
const pad = (n: number) => String(n).padStart(2, '0')
const days = computed(() => Array.from({ length: daysInMonth(props.month) }, (_, i) => `${props.month}-${pad(i + 1)}`))
const lead = computed(() => weekdayOf(days.value[0]) - 1)
const cls = { sm: 'h-[38px] text-xs', md: 'h-12 text-sm', lg: 'h-[118px] text-[15px]' }[props.size]
const emojiCls = { sm: 'text-sm', md: 'text-lg', lg: 'text-[26px]' }[props.size]
const gap = { sm: 'gap-[3px]', md: 'gap-1', lg: 'gap-2' }[props.size]
</script>

<template>
  <div class="grid grid-cols-7" :class="gap">
    <div v-for="w in WEEK" :key="w" class="pb-1 text-center text-xs text-ink3">{{ w }}</div>
    <div v-for="n in lead" :key="'lead' + n" />
    <button v-for="d in days" :key="d" type="button" @click="emit('select', d)"
      class="flex flex-col items-center justify-center gap-px rounded-[10px] border"
      :class="[cls,
        d === today ? 'bg-today border-accent font-bold' : moods[d] !== undefined ? 'bg-card border-line' : 'border-transparent',
        d > today ? 'text-ink3' : 'text-ink']">
      <span class="leading-none">{{ Number(d.slice(-2)) }}</span>
      <span class="leading-tight" :class="emojiCls">{{ moods[d] ?? '' }}</span>
    </button>
  </div>
</template>
```

`moods` 的 key 存在但值為 null 代表有日記但沒選心情，仍要顯示卡片底色，所以用 `!== undefined` 判斷。

- [ ] **Step 2: index.vue**

```vue
<script setup lang="ts">
import { formatMonthTitle, formatTitle, formatWeekday, todayKey } from '../../shared/date'
import type { EntrySummary } from '../../shared/types'

const { month, prev, next, today: goToday } = useMonth()
const today = todayKey()
const { data: list } = await useFetch<EntrySummary[]>('/api/entries', { query: { month }, default: () => [] })
const moods = computed(() => Object.fromEntries(list.value.map((e) => [e.date, e.mood])))
const todayEntry = computed(() => list.value.find((e) => e.date === today) ?? null)
const open = (d: string) => navigateTo(`/entry/${d}`)
</script>

<template>
  <div class="flex">
    <div class="flex min-w-0 grow flex-col gap-6 px-5 pt-14 lg:gap-7 lg:px-12 lg:pt-10">
      <!-- 手機標題 -->
      <div class="flex flex-col gap-1 lg:hidden">
        <span class="text-[13px] tracking-[0.08em] text-ink2">{{ formatWeekday(today) }}</span>
        <h1 class="font-serif text-[30px] font-bold leading-tight">{{ formatTitle(today) }}</h1>
      </div>
      <!-- 月份列 -->
      <div class="flex items-center justify-between">
        <h2 class="hidden font-serif text-[32px] font-bold lg:block">{{ formatMonthTitle(month) }}</h2>
        <button type="button" class="flex size-11 items-center justify-center text-ink2 lg:hidden" @click="prev"><AppIcon name="prev" /></button>
        <span class="font-serif text-base lg:hidden">{{ formatMonthTitle(month) }}</span>
        <button type="button" class="flex size-11 items-center justify-center text-ink2 lg:hidden" @click="next"><AppIcon name="next" /></button>
        <div class="hidden items-center gap-1.5 lg:flex">
          <button type="button" class="flex size-11 items-center justify-center rounded-[10px] border border-line bg-card text-ink2" @click="prev"><AppIcon name="prev" :size="20" /></button>
          <button type="button" class="flex h-11 items-center rounded-[10px] border border-line bg-card px-4 text-sm" @click="goToday">今天</button>
          <button type="button" class="flex size-11 items-center justify-center rounded-[10px] border border-line bg-card text-ink2" @click="next"><AppIcon name="next" :size="20" /></button>
        </div>
      </div>
      <MonthCalendar :month="month" :moods="moods" :today="today" size="md" class="lg:hidden" @select="open" />
      <MonthCalendar :month="month" :moods="moods" :today="today" size="lg" class="hidden lg:grid" @select="open" />
      <!-- 手機今日卡 -->
      <NuxtLink :to="`/entry/${today}`" class="flex items-center gap-3.5 rounded-2xl border border-line bg-card p-4 lg:hidden">
        <span class="text-[34px] leading-none">{{ todayEntry?.mood ?? '✏️' }}</span>
        <div class="flex min-w-0 grow flex-col gap-1">
          <span class="text-[13px] text-ink2">今天的日記</span>
          <span class="truncate text-[15px]">{{ todayEntry?.excerpt || '還沒寫，點一下開始。' }}</span>
        </div>
        <AppIcon name="chevron" :size="20" class="text-ink3" />
      </NuxtLink>
    </div>
    <!-- 桌機右側今日預覽 -->
    <aside class="hidden w-[400px] shrink-0 flex-col gap-5 border-l border-line bg-card px-8 py-10 lg:flex min-h-dvh">
      <div class="flex flex-col gap-1">
        <span class="text-[13px] tracking-[0.08em] text-ink2">{{ formatWeekday(today) }} · 今天</span>
        <h2 class="font-serif text-[26px] font-bold">{{ formatTitle(today) }}</h2>
      </div>
      <span v-if="todayEntry?.mood" class="text-[44px] leading-none">{{ todayEntry.mood }}</span>
      <p v-if="todayEntry" class="text-[15px] leading-[1.85]">{{ todayEntry.excerpt }}</p>
      <img v-if="todayEntry?.firstImageUrl" :src="todayEntry.firstImageUrl" class="h-[150px] w-full rounded-[10px] object-cover" alt="">
      <p v-if="!todayEntry" class="text-[15px] leading-[1.7] text-ink2">今天還沒有日記。</p>
      <div class="grow" />
      <NuxtLink :to="`/entry/${today}`" class="flex h-11 items-center justify-center gap-2 rounded-[10px] border border-line bg-paper text-sm">
        <AppIcon name="pen" :size="18" />{{ todayEntry ? '繼續寫' : '開始寫' }}
      </NuxtLink>
    </aside>
  </div>
</template>
```

`useFetch` 的 `query: { month }` 傳入 ref，月份改變會自動重抓。

- [ ] **Step 3: 視覺確認**

`npm run dev`，先用 curl PUT 幾筆不同心情的日記到本月，開 `/`：手機寬月曆日期上出現 emoji、今天有邊框；桌機寬右側出現今日預覽；左右箭頭切換月份後月曆更新。與 `design/` 中 `Main.dc.html`、`DesktopCalendar.dc.html` 的截圖比對。

- [ ] **Step 4: Commit**

```bash
git add app/components/MonthCalendar.vue app/pages/index.vue
git commit -m "feat(calendar): add month calendar home page (#1)

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 10: 編輯頁：Tiptap、心情、圖片上傳、emoji、自動儲存、刪除、空狀態

**Files:**
- Create: `app/components/MoodPicker.vue`、`app/components/JournalEditor.vue`、`app/components/EmptyEntry.vue`、`app/components/ConfirmDialog.vue`、`app/composables/useEntry.ts`、`app/pages/entry/[date].vue`

**Interfaces:**
- Consumes: `GET/PUT/DELETE /api/entries/:date`、`POST /api/upload`、`GET /api/entries?month=`、`MonthCalendar`、`isEmptyDoc`、`emptyDoc`
- Produces:
  - `<MoodPicker v-model="mood" :size="40|44" />`
  - `<JournalEditor v-model="doc" :date="date" @uploading="(bool)=>…" />` — 內含工具列與 emoji picker
  - `<EmptyEntry :date v-model:mood @start="…" />`
  - `<ConfirmDialog v-model:open title message confirm-label @confirm />`
  - `useEntry(date): { entry, mood, content, status: 'idle'|'saving'|'saved'|'error', savedAt, exists, save(), remove(), start() }`

- [ ] **Step 1: MoodPicker.vue**

```vue
<script setup lang="ts">
withDefaults(defineProps<{ size?: number }>(), { size: 44 })
const model = defineModel<string | null>({ default: null })
const MOODS = ['😊', '😌', '🤩', '😐', '😔', '🥱', '😤']
const toggle = (e: string) => { model.value = model.value === e ? null : e }
</script>

<template>
  <div class="flex flex-wrap gap-2" role="radiogroup" aria-label="今天的心情">
    <button v-for="e in MOODS" :key="e" type="button" role="radio" :aria-checked="model === e"
      class="flex items-center justify-center rounded-full border-2"
      :style="{ width: `${size}px`, height: `${size}px`, fontSize: `${Math.round(size * 0.52)}px` }"
      :class="model === e ? 'bg-accent-soft border-accent' : 'bg-chip border-transparent'"
      @click="toggle(e)">{{ e }}</button>
  </div>
</template>
```

- [ ] **Step 2: JournalEditor.vue**

```vue
<script setup lang="ts">
import { EditorContent, useEditor } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import { Placeholder } from '@tiptap/extensions'
import type { TiptapDoc } from '../../shared/types'

const props = defineProps<{ date: string }>()
const model = defineModel<TiptapDoc>({ required: true })
const emit = defineEmits<{ uploading: [busy: boolean] }>()

const showEmoji = ref(false)
const fileInput = ref<HTMLInputElement>()

const editor = useEditor({
  content: model.value,
  extensions: [
    StarterKit.configure({ heading: { levels: [2] } }),
    Image.configure({ inline: false, allowBase64: false }),
    Placeholder.configure({ placeholder: '今天發生了什麼…' }),
  ],
  editorProps: {
    attributes: { class: 'prose-journal outline-none min-h-[40vh]' },
    handleDrop: (_view, event) => { const f = event.dataTransfer?.files?.[0]; if (f?.type.startsWith('image/')) { upload(f); return true } return false },
    handlePaste: (_view, event) => { const f = event.clipboardData?.files?.[0]; if (f?.type.startsWith('image/')) { upload(f); return true } return false },
  },
  onUpdate: ({ editor }) => { model.value = editor.getJSON() as TiptapDoc },
})

watch(model, (doc) => {
  if (!editor.value) return
  if (JSON.stringify(editor.value.getJSON()) !== JSON.stringify(doc)) editor.value.commands.setContent(doc, { emitUpdate: false })
})

async function upload(file: File) {
  emit('uploading', true)
  try {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('date', props.date)
    const { url } = await $fetch<{ url: string }>('/api/upload', { method: 'POST', body: fd })
    editor.value?.chain().focus().setImage({ src: url }).run()
  } finally {
    emit('uploading', false)
  }
}

function pickFile(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (f) upload(f)
  ;(e.target as HTMLInputElement).value = ''
}

function insertEmoji(e: Event) {
  const unicode = (e as CustomEvent<{ unicode: string }>).detail.unicode
  editor.value?.chain().focus().insertContent(unicode).run()
  showEmoji.value = false
}

onMounted(() => { import('emoji-picker-element') })
onBeforeUnmount(() => editor.value?.destroy())

const tools = computed(() => [
  { icon: 'heading', active: editor.value?.isActive('heading'), run: () => editor.value?.chain().focus().toggleHeading({ level: 2 }).run() },
  { icon: 'bold', active: editor.value?.isActive('bold'), run: () => editor.value?.chain().focus().toggleBold().run() },
  { icon: 'italic', active: editor.value?.isActive('italic'), run: () => editor.value?.chain().focus().toggleItalic().run() },
  null,
  { icon: 'list', active: editor.value?.isActive('bulletList'), run: () => editor.value?.chain().focus().toggleBulletList().run() },
  { icon: 'quote', active: editor.value?.isActive('blockquote'), run: () => editor.value?.chain().focus().toggleBlockquote().run() },
  null,
  { icon: 'image', active: false, run: () => fileInput.value?.click() },
  { icon: 'smile', active: showEmoji.value, run: () => { showEmoji.value = !showEmoji.value } },
])
</script>

<template>
  <div class="flex flex-col gap-4">
    <EditorContent :editor="editor" />
    <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="pickFile">
  </div>
</template>
```

工具列必須在頁面裡定位（手機貼底、桌機在頂部），所以把工具列拆成 `defineExpose({ tools, showEmoji, insertEmoji })`，頁面用 `ref` 拿到後渲染。在 `<script setup>` 末尾加：

```ts
defineExpose({ tools, showEmoji, insertEmoji })
```

- [ ] **Step 3: 編輯區排版 CSS**（加到 `app/assets/css/main.css` 末尾）

```css
.prose-journal { font-size: 16px; line-height: 1.85; }
.prose-journal > * + * { margin-top: 18px; }
.prose-journal h2 { font-family: var(--font-serif); font-size: 22px; font-weight: 700; }
.prose-journal img { width: 100%; border-radius: 12px; }
.prose-journal ul { padding-left: 1.4em; list-style: disc; }
.prose-journal blockquote { border-left: 2px solid var(--line); padding-left: 14px; color: var(--ink2); }
.prose-journal p.is-editor-empty:first-child::before { content: attr(data-placeholder); color: var(--ink3); float: left; height: 0; pointer-events: none; }
@media (min-width: 1024px) { .prose-journal { font-size: 17px; } }
emoji-picker { --background: var(--card); --border-color: var(--line); --input-border-color: var(--line); --indicator-color: var(--accent); width: 100%; height: 320px; }
```

- [ ] **Step 4: ConfirmDialog.vue 與 EmptyEntry.vue**

`ConfirmDialog.vue`：

```vue
<script setup lang="ts">
defineProps<{ title: string; message: string; confirmLabel: string }>()
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ confirm: [] }>()
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" @click.self="open = false">
    <div role="dialog" aria-modal="true" class="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-line bg-card p-6">
      <h3 class="font-serif text-lg font-bold">{{ title }}</h3>
      <p class="text-sm leading-relaxed text-ink2">{{ message }}</p>
      <div class="flex justify-end gap-2">
        <button type="button" class="h-11 rounded-full px-5 text-sm" @click="open = false">取消</button>
        <button type="button" class="h-11 rounded-full bg-accent px-5 text-sm font-bold text-[#FFF7EE]" @click="emit('confirm'); open = false">{{ confirmLabel }}</button>
      </div>
    </div>
  </div>
</template>
```

`EmptyEntry.vue`：

```vue
<script setup lang="ts">
import { formatTitle, formatWeekday } from '../../shared/date'
defineProps<{ date: string }>()
const mood = defineModel<string | null>('mood', { default: null })
const emit = defineEmits<{ start: [] }>()
</script>

<template>
  <div class="flex grow flex-col items-center justify-center gap-7 px-9 pb-20 text-center">
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" aria-hidden="true">
      <rect x="22" y="14" width="76" height="92" rx="8" class="fill-card stroke-line" stroke-width="2" />
      <path d="M36 40h48M36 54h48M36 68h30" class="stroke-line" stroke-width="2.5" stroke-linecap="round" />
      <path d="M78 96l22-22a5 5 0 0 0-7-7L71 89l-2 9z" class="fill-accent-soft stroke-accent" stroke-width="2" stroke-linejoin="round" />
    </svg>
    <div class="flex flex-col gap-2">
      <span class="hidden text-[13px] tracking-[0.08em] text-ink2 lg:block">{{ formatWeekday(date) }} · {{ formatTitle(date) }}</span>
      <h2 class="font-serif text-[22px] font-bold lg:text-[28px]">這一天還是空白的</h2>
      <p class="text-sm leading-[1.7] text-ink2 lg:text-[15px]">先選一個心情，或直接寫下一句話就好。</p>
    </div>
    <MoodPicker v-model="mood" :size="40" />
    <button type="button" class="flex h-12 items-center gap-2 rounded-full bg-accent px-7 text-[15px] font-bold text-[#FFF7EE]" @click="emit('start')">
      <AppIcon name="pen" :size="18" />開始寫這一天
    </button>
  </div>
</template>
```

- [ ] **Step 5: useEntry.ts（自動儲存）**

```ts
import { emptyDoc, isEmptyDoc } from '../../shared/content'
import type { Entry, TiptapDoc } from '../../shared/types'

export function useEntry(date: string) {
  const { data: entry } = useFetch<Entry | null>(`/api/entries/${date}`, {
    default: () => null,
    onResponseError: ({ response }) => { if (response.status !== 404) throw createError({ statusCode: response.status }) },
    ignoreResponseError: true,
    transform: (e) => (e && 'date' in e ? e : null),
  })

  const exists = ref(false)
  const mood = ref<string | null>(null)
  const content = ref<TiptapDoc>(emptyDoc())
  const status = ref<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const savedAt = ref<Date | null>(null)

  watch(entry, (e) => {
    exists.value = Boolean(e)
    mood.value = e?.mood ?? null
    content.value = e?.content ?? emptyDoc()
    savedAt.value = e ? new Date(e.updatedAt) : null
  }, { immediate: true })

  let timer: ReturnType<typeof setTimeout> | undefined
  let dirty = false

  async function save() {
    clearTimeout(timer)
    if (!dirty) return
    dirty = false
    status.value = 'saving'
    try {
      const saved = await $fetch<Entry>(`/api/entries/${date}`, { method: 'PUT', body: { mood: mood.value, content: content.value } })
      exists.value = true
      savedAt.value = new Date(saved.updatedAt)
      status.value = 'saved'
    } catch {
      status.value = 'error'
      dirty = true
    }
  }

  function schedule() {
    dirty = true
    clearTimeout(timer)
    timer = setTimeout(save, 1200)
  }

  watch(mood, (m, old) => { if (m !== old) schedule() })
  watch(content, () => { if (exists.value || !isEmptyDoc(content.value)) schedule() }, { deep: true })

  function start() {
    exists.value = true
    schedule()
  }

  async function remove() {
    clearTimeout(timer)
    dirty = false
    await $fetch(`/api/entries/${date}`, { method: 'DELETE' })
  }

  onBeforeUnmount(() => { if (dirty) save() })

  return { entry, exists, mood, content, status, savedAt, save, remove, start }
}
```

- [ ] **Step 6: pages/entry/[date].vue**

```vue
<script setup lang="ts">
import { isDateKey, formatTitle, formatWeekday, monthOf, todayKey } from '../../../shared/date'
import type { EntrySummary } from '../../../shared/types'

const route = useRoute()
const date = route.params.date as string
if (!isDateKey(date)) throw createError({ statusCode: 404, statusMessage: '日期格式不正確' })

const { exists, mood, content, status, savedAt, save, remove, start } = useEntry(date)
const editorRef = ref<{ tools: any[]; showEmoji: boolean; insertEmoji: (e: Event) => void }>()
const uploading = ref(false)
const menuOpen = ref(false)
const confirmOpen = ref(false)

const month = monthOf(date)
const { data: list } = await useFetch<EntrySummary[]>('/api/entries', { query: { month }, default: () => [] })
const moods = computed(() => Object.fromEntries(list.value.map((e) => [e.date, e.mood])))
const recent = computed(() => list.value.filter((e) => e.date !== date).slice(0, 3))

const statusText = computed(() => {
  if (uploading.value) return '圖片上傳中…'
  if (status.value === 'saving') return '儲存中…'
  if (status.value === 'error') return '儲存失敗，稍後重試'
  if (savedAt.value) return `已自動儲存 · ${savedAt.value.toLocaleTimeString('zh-TW', { hour: 'numeric', minute: '2-digit' })}`
  return ''
})

async function onDelete() {
  await remove()
  navigateTo('/')
}
async function done() {
  await save()
  navigateTo('/')
}
</script>

<template>
  <div class="flex min-h-dvh">
    <!-- 桌機左欄：迷你月曆 + 最近 -->
    <aside class="hidden w-[340px] shrink-0 flex-col gap-5 border-r border-line px-7 py-10 lg:flex">
      <MonthCalendar :month="month" :moods="moods" :today="todayKey()" size="sm" @select="(d) => navigateTo(`/entry/${d}`)" />
      <div class="h-px bg-line" />
      <span class="text-xs tracking-[0.08em] text-ink3">最近</span>
      <NuxtLink v-for="e in recent" :key="e.date" :to="`/entry/${e.date}`" class="flex items-center gap-2.5 rounded-[10px] border border-line bg-card px-3 py-2.5">
        <span class="text-lg leading-none">{{ e.mood ?? '·' }}</span>
        <span class="w-8 text-xs text-ink2">{{ Number(e.date.slice(-2)) }} 日</span>
        <span class="truncate text-[13px]">{{ e.excerpt }}</span>
      </NuxtLink>
    </aside>

    <div class="flex min-w-0 grow flex-col">
      <!-- 手機標題列 -->
      <header class="flex items-center justify-between px-4 pt-[54px] pb-2 lg:hidden">
        <NuxtLink to="/" class="flex size-11 items-center" aria-label="返回"><AppIcon name="back" :size="24" /></NuxtLink>
        <span class="font-serif text-[17px] font-bold">{{ formatTitle(date) }} · {{ formatWeekday(date) }}</span>
        <button v-if="exists" type="button" class="flex size-11 items-center justify-end" aria-label="更多" @click="menuOpen = !menuOpen"><AppIcon name="more" :size="24" /></button>
        <span v-else class="size-11" />
      </header>

      <template v-if="!exists">
        <EmptyEntry :date="date" v-model:mood="mood" @start="start" />
      </template>

      <template v-else>
        <!-- 桌機頂列：工具列 + 狀態 -->
        <div class="hidden items-center justify-between px-12 pt-6 lg:flex">
          <div class="flex w-fit items-center gap-0.5 rounded-[14px] border border-line bg-card px-1.5 py-1">
            <template v-for="(t, i) in editorRef?.tools ?? []" :key="i">
              <div v-if="!t" class="mx-1 h-[22px] w-px bg-line" />
              <button v-else type="button" class="flex size-10 items-center justify-center rounded-[10px]" :class="t.active ? 'bg-accent-soft text-accent' : 'text-ink2'" @click="t.run"><AppIcon :name="t.icon" :size="20" /></button>
            </template>
          </div>
          <div class="flex items-center gap-3.5">
            <span class="text-[13px] text-ink3">{{ statusText }}</span>
            <button type="button" class="text-ink2" aria-label="更多" @click="menuOpen = !menuOpen"><AppIcon name="more" /></button>
          </div>
        </div>

        <div class="relative grow px-5 pt-2 lg:flex lg:justify-center lg:px-12 lg:pt-9">
          <div class="flex flex-col gap-4 lg:w-[640px] lg:gap-6">
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
            <JournalEditor ref="editorRef" v-model="content" :date="date" @uploading="uploading = $event" />
            <div class="h-40 lg:h-10" />
          </div>
          <div v-if="menuOpen" class="absolute right-5 top-0 z-40 rounded-xl border border-line bg-card p-1 shadow lg:right-12 lg:top-2" @click="menuOpen = false">
            <button type="button" class="flex h-11 items-center gap-2 rounded-lg px-3 text-sm text-accent" @click="confirmOpen = true"><AppIcon name="trash" :size="18" />刪除這一天</button>
          </div>
        </div>

        <!-- 手機貼底工具列 -->
        <div class="fixed inset-x-0 bottom-0 flex flex-col gap-2.5 bg-paper px-4 pt-2.5 pb-[max(1.5rem,env(safe-area-inset-bottom))] lg:hidden">
          <div class="flex items-center gap-0.5 rounded-[14px] border border-line bg-card px-1.5 py-1">
            <template v-for="(t, i) in editorRef?.tools ?? []" :key="i">
              <div v-if="!t" class="mx-1 h-[22px] w-px bg-line" />
              <button v-else type="button" class="flex size-10 items-center justify-center rounded-[10px]" :class="t.active ? 'bg-accent-soft text-accent' : 'text-ink2'" @click="t.run"><AppIcon :name="t.icon" :size="20" /></button>
            </template>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-xs text-ink3">{{ statusText }}</span>
            <button type="button" class="flex h-11 items-center rounded-full bg-accent px-5 text-[15px] font-bold text-[#FFF7EE]" @click="done">完成</button>
          </div>
        </div>

        <!-- emoji picker（兩種版面共用） -->
        <div v-if="editorRef?.showEmoji" class="fixed inset-x-4 bottom-36 z-40 lg:absolute lg:left-12 lg:top-20 lg:w-[360px]">
          <emoji-picker locale="zh_TW" @emoji-click="editorRef?.insertEmoji($event)" />
        </div>
      </template>
    </div>

    <ConfirmDialog v-model:open="confirmOpen" title="刪除這一天的日記？" message="刪除後無法復原，圖片仍會留在儲存空間。" confirm-label="刪除" @confirm="onDelete" />
  </div>
</template>
```

`emoji-picker-element` 的 zh_TW 資料集需要額外的 `dataSource`；第一版用預設英文資料集即可（把 `locale` 屬性拿掉），搜尋是英文關鍵字。

- [ ] **Step 7: 手動驗證清單**

`npm run dev` 後逐項確認：

1. 開 `/entry/<今天>`（尚無資料）→ 空狀態；點心情或「開始寫這一天」→ 進入編輯器，1.2 秒後狀態列顯示「已自動儲存」，重新整理後內容仍在。
2. 打字、粗體、標題、清單、引用各試一次，重整後保留。
3. 點圖片工具選一張圖 → 狀態列「圖片上傳中…」→ 圖片出現在游標處；拖曳、貼上圖片也成功。
4. 點笑臉 → picker 出現 → 點 emoji 插入內文。
5. 右上「…」→「刪除這一天」→ 確認 → 回首頁且該日不再有 emoji。
6. 網址 `/entry/2026-02-30` → 404 頁。
7. 手機寬（390）與桌機寬（1440）各截圖對照 `MobileEntry`、`MobileEmpty`、`DesktopEntry`、`DesktopEmpty` 畫板。

- [ ] **Step 8: Commit**

```bash
git add app
git commit -m "feat(editor): add tiptap entry page with mood, images, emoji and autosave (#1)

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 11: 時間軸頁

**Files:**
- Create: `app/components/TimelineCard.vue`、`app/pages/timeline.vue`（取代殼）

**Interfaces:**
- Consumes: `GET /api/entries?month=`、`useMonth`、`weekdayOf`、`formatMonthTitle`
- Produces: `<TimelineCard :entry="EntrySummary" size="m|l" />`

- [ ] **Step 1: TimelineCard.vue**

```vue
<script setup lang="ts">
import { weekdayOf } from '../../shared/date'
import type { EntrySummary } from '../../shared/types'
const props = withDefaults(defineProps<{ entry: EntrySummary; size?: 'm' | 'l' }>(), { size: 'm' })
const WEEK = ['', '週一', '週二', '週三', '週四', '週五', '週六', '週日']
const day = computed(() => Number(props.entry.date.slice(-2)))
</script>

<template>
  <NuxtLink :to="`/entry/${entry.date}`" class="flex gap-3.5">
    <div class="flex w-11 shrink-0 flex-col items-center gap-0.5 pt-1.5">
      <span class="font-serif font-bold leading-none" :class="size === 'l' ? 'text-[26px]' : 'text-[22px]'">{{ day }}</span>
      <span class="text-[11px] text-ink3">{{ WEEK[weekdayOf(entry.date)] }}</span>
    </div>
    <div class="flex min-w-0 grow flex-col gap-3 rounded-2xl border border-line bg-card px-4 py-3.5">
      <div class="flex items-center gap-2.5">
        <span class="text-[22px] leading-none">{{ entry.mood ?? '·' }}</span>
        <p class="line-clamp-2 leading-[1.7]" :class="size === 'l' ? 'text-[15px]' : 'text-sm'">{{ entry.excerpt || '（沒有文字）' }}</p>
      </div>
      <img v-if="entry.firstImageUrl" :src="entry.firstImageUrl" alt="" class="w-full rounded-[10px] object-cover" :class="size === 'l' ? 'h-40' : 'h-[120px]'">
    </div>
  </NuxtLink>
</template>
```

- [ ] **Step 2: timeline.vue**

```vue
<script setup lang="ts">
import { formatMonthTitle } from '../../shared/date'
import type { EntrySummary } from '../../shared/types'
const { month, prev, next } = useMonth()
const { data: list } = await useFetch<EntrySummary[]>('/api/entries', { query: { month }, default: () => [] })
</script>

<template>
  <div class="flex flex-col gap-5 px-5 pt-14 lg:gap-7 lg:px-12 lg:pt-10">
    <div class="flex items-end justify-between">
      <h1 class="font-serif text-[28px] font-bold lg:text-[32px]">時間軸</h1>
      <div class="flex items-center gap-1 pb-1.5">
        <button type="button" class="flex size-11 items-center justify-center text-ink2" aria-label="上個月" @click="prev"><AppIcon name="prev" :size="20" /></button>
        <span class="font-serif text-sm text-ink2 lg:text-[15px]">{{ formatMonthTitle(month) }}</span>
        <button type="button" class="flex size-11 items-center justify-center text-ink2" aria-label="下個月" @click="next"><AppIcon name="next" :size="20" /></button>
      </div>
    </div>
    <p v-if="!list.length" class="text-sm text-ink2">這個月還沒有日記。</p>
    <div class="flex flex-col gap-3.5 lg:w-[720px] lg:gap-[18px]">
      <TimelineCard v-for="e in list" :key="e.date" :entry="e" size="m" class="lg:hidden" />
      <TimelineCard v-for="e in list" :key="'l' + e.date" :entry="e" size="l" class="hidden lg:flex" />
    </div>
  </div>
</template>
```

- [ ] **Step 3: 視覺確認**

`/timeline` 手機與桌機寬截圖，對照 `MobileTimeline`、`DesktopTimeline` 畫板；卡片點擊進入該日；切月份清單更新。

- [ ] **Step 4: Commit**

```bash
git add app/components/TimelineCard.vue app/pages/timeline.vue
git commit -m "feat(timeline): add monthly timeline page (#1)

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 12: 統計頁

**Files:**
- Create: `app/pages/stats.vue`（取代殼）

**Interfaces:**
- Consumes: `GET /api/stats?month=`、`useMonth`

- [ ] **Step 1: stats.vue**

```vue
<script setup lang="ts">
import { formatMonthTitle } from '../../shared/date'
import type { Stats } from '../../shared/types'
const { month, prev, next } = useMonth()
const { data: stats } = await useFetch<Stats>('/api/stats', { query: { month }, default: () => ({ daysWritten: 0, streak: 0, moods: [], uploads: 0 }) })
const max = computed(() => stats.value.moods[0]?.count ?? 1)
</script>

<template>
  <div class="flex flex-col gap-5 px-5 pt-14 lg:gap-7 lg:px-12 lg:pt-10">
    <div class="flex items-end justify-between">
      <h1 class="font-serif text-[28px] font-bold lg:text-[32px]">統計</h1>
      <div class="flex items-center gap-1 pb-1.5">
        <button type="button" class="flex size-11 items-center justify-center text-ink2" aria-label="上個月" @click="prev"><AppIcon name="prev" :size="20" /></button>
        <span class="font-serif text-sm text-ink2 lg:text-[15px]">{{ formatMonthTitle(month) }}</span>
        <button type="button" class="flex size-11 items-center justify-center text-ink2" aria-label="下個月" @click="next"><AppIcon name="next" :size="20" /></button>
      </div>
    </div>
    <div class="flex flex-col gap-5 lg:w-[640px]">
      <div class="flex gap-3">
        <div v-for="tile in [['本月寫了', stats.daysWritten], ['連續書寫', stats.streak]]" :key="tile[0]" class="flex flex-1 flex-col gap-1 rounded-2xl border border-line bg-card p-4">
          <span class="text-xs text-ink2">{{ tile[0] }}</span>
          <div class="flex items-baseline gap-1">
            <span class="font-serif text-[30px] font-bold leading-none">{{ tile[1] }}</span>
            <span class="text-[13px] text-ink3">天</span>
          </div>
        </div>
      </div>
      <div class="flex flex-col gap-3.5 rounded-2xl border border-line bg-card px-4 py-[18px]">
        <span class="font-serif text-[15px] font-bold">本月心情分布</span>
        <p v-if="!stats.moods.length" class="text-sm text-ink2">這個月還沒有選過心情。</p>
        <div v-for="m in stats.moods" :key="m.mood" class="flex h-[34px] items-center gap-3 lg:h-[38px]">
          <span class="w-7 text-center text-[22px] leading-none">{{ m.mood }}</span>
          <div class="h-2.5 grow overflow-hidden rounded bg-chip">
            <div class="h-full rounded-r bg-accent" :style="{ width: `${Math.round((m.count / max) * 100)}%` }" />
          </div>
          <span class="w-9 text-right text-[13px] text-ink2">{{ m.count }} 天</span>
        </div>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 2: 視覺確認**

`/stats` 對照 `MobileStats`、`DesktopStats` 畫板；數字與 curl `/api/stats` 一致。

- [ ] **Step 3: Commit**

```bash
git add app/pages/stats.vue
git commit -m "feat(stats): add monthly stats page (#1)

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 13: 設定頁

**Files:**
- Create: `app/pages/settings.vue`（取代殼）

**Interfaces:**
- Consumes: `useTheme`、`GET /api/stats`（uploads）、`GET /api/export`

- [ ] **Step 1: settings.vue**

```vue
<script setup lang="ts">
import type { Stats } from '../../shared/types'
const { theme, setTheme } = useTheme()
const { data: stats } = await useFetch<Stats>('/api/stats', { default: () => ({ daysWritten: 0, streak: 0, moods: [], uploads: 0 }) })
const config = useRuntimeConfig()
const themes: { key: 'light' | 'dark' | 'system'; label: string }[] = [
  { key: 'light', label: '淺色' }, { key: 'dark', label: '深色' }, { key: 'system', label: '跟隨系統' },
]
const cleared = ref(false)
async function clearCache() {
  if (!import.meta.client) return
  const keys = await caches.keys()
  await Promise.all(keys.map((k) => caches.delete(k)))
  cleared.value = true
}
</script>

<template>
  <div class="flex flex-col gap-6 px-5 pt-14 lg:gap-7 lg:px-12 lg:pt-10">
    <h1 class="font-serif text-[28px] font-bold lg:text-[32px]">設定</h1>
    <div class="flex flex-col gap-6 lg:w-[560px]">
      <section class="flex flex-col gap-2">
        <span class="px-1 text-xs tracking-[0.08em] text-ink3">外觀</span>
        <div class="flex min-h-[52px] items-center gap-3.5 rounded-2xl border border-line bg-card px-4 py-2.5">
          <AppIcon name="moon" :size="20" class="text-ink2" />
          <span class="grow text-[15px]">外觀</span>
          <div class="flex gap-1 rounded-[10px] bg-chip p-[3px]">
            <button v-for="t in themes" :key="t.key" type="button" class="rounded-lg px-2.5 py-1.5 text-xs"
              :class="theme === t.key ? 'bg-card font-bold text-ink' : 'text-ink2'" @click="setTheme(t.key)">{{ t.label }}</button>
          </div>
        </div>
      </section>

      <section class="flex flex-col gap-2">
        <span class="px-1 text-xs tracking-[0.08em] text-ink3">儲存空間</span>
        <div class="flex flex-col rounded-2xl border border-line bg-card">
          <div class="flex min-h-[52px] items-center gap-3.5 px-4">
            <AppIcon name="cloud" :size="20" class="text-ink2" />
            <span class="grow text-[15px]">圖片儲存</span>
            <span class="text-[13px] text-ink3">S3</span>
          </div>
          <div class="mx-4 h-px bg-line" />
          <div class="flex min-h-[52px] items-center gap-3.5 px-4">
            <AppIcon name="image" :size="20" class="text-ink2" />
            <span class="grow text-[15px]">本月上傳</span>
            <span class="text-[13px] text-ink3">{{ stats.uploads }} 張</span>
          </div>
        </div>
      </section>

      <section class="flex flex-col gap-2">
        <span class="px-1 text-xs tracking-[0.08em] text-ink3">資料</span>
        <div class="flex flex-col rounded-2xl border border-line bg-card">
          <a href="/api/export" download="journal-export.json" class="flex min-h-[52px] items-center gap-3.5 px-4">
            <AppIcon name="download" :size="20" class="text-ink2" />
            <span class="grow text-[15px]">匯出所有日記</span>
            <span class="text-[13px] text-ink3">JSON</span>
            <AppIcon name="chevron" :size="18" class="text-ink3" />
          </a>
          <div class="mx-4 h-px bg-line" />
          <button type="button" class="flex min-h-[52px] items-center gap-3.5 px-4 text-accent" @click="clearCache">
            <AppIcon name="trash" :size="20" />
            <span class="grow text-left text-[15px]">{{ cleared ? '已清除本機快取' : '清除本機快取' }}</span>
          </button>
        </div>
      </section>

      <span class="px-1 text-xs text-ink3">版本 0.1.0</span>
    </div>
  </div>
</template>
```

`config` 變數未使用可移除；S3 連線狀態第一版只顯示「S3」字樣，不打探測請求。

- [ ] **Step 2: 視覺與功能確認**

切換三種外觀立即生效、重整後保留；「匯出所有日記」下載 JSON；「清除本機快取」按下後文字變更。對照 `MobileSettings`、`DesktopSettings` 畫板。

- [ ] **Step 3: Commit**

```bash
git add app/pages/settings.vue
git commit -m "feat(settings): add appearance, storage and export settings page (#1)

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 14: PWA icon 與安裝驗證

**Files:**
- Create: `public/icons/icon-192.png`、`public/icons/icon-512.png`、`scripts/make-icons.mjs`

- [ ] **Step 1: 產生 icon**

用 `sharp`（`npm i -D sharp`）把一個 SVG 轉成兩個 PNG。`scripts/make-icons.mjs`：

```js
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" fill="#F4EDE0"/>
  <rect x="136" y="96" width="240" height="320" rx="24" fill="#FCF9F3" stroke="#E2D7C3" stroke-width="10"/>
  <path d="M184 176h144M184 232h144M184 288h96" stroke="#E2D7C3" stroke-width="14" stroke-linecap="round"/>
  <path d="M300 392l84-84a20 20 0 0 0-28-28l-84 84-8 36z" fill="#F3E1D3" stroke="#B4552F" stroke-width="12" stroke-linejoin="round"/>
</svg>`

mkdirSync('public/icons', { recursive: true })
for (const size of [192, 512]) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(`public/icons/icon-${size}.png`)
}
console.log('icons written')
```

Run: `node scripts/make-icons.mjs`

- [ ] **Step 2: 驗證 manifest**

```bash
npm run build && node .output/server/index.mjs &
curl -s localhost:3000/manifest.webmanifest
```

Expected: JSON 含 `name: "紙頁日記"` 與兩個 icon。用 Chrome 開 `localhost:3000`，網址列出現「安裝」圖示，安裝後以獨立視窗開啟。

- [ ] **Step 3: Commit**

```bash
git add public/icons scripts/make-icons.mjs package.json package-lock.json
git commit -m "feat(pwa): add installable manifest icons (#1)

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 15: 收尾：README 與完整測試

**Files:**
- Create: `README.md`

- [ ] **Step 1: README.md**

````markdown
# 紙頁日記

單人、一天一篇的 Nuxt 日記，支援心情 emoji、Tiptap 內文、S3 圖片、PWA 安裝。

## 開發

```bash
cp .env.example .env   # 填入 PostgreSQL 與 S3 設定
npm install
npm run db:migrate
npm run dev
```

## 測試

```bash
npm test                                   # 單元測試
DATABASE_URL_TEST=postgres://... npm test  # 加上 API 測試
```

## 設計稿

`design/paper-journal.html` 以瀏覽器開啟即可檢視；`node design/build.mjs` 重新產生畫板。
````

- [ ] **Step 2: 全部測試與建置**

Run: `npm test` 與 `npm run build`
Expected: 測試全部通過、建置無錯誤。

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs(readme): add setup and testing instructions (#1)

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

## Self-Review

- **Spec coverage**：六畫面（Task 9、10、11、12、13）、手機/桌機版面（layout Task 8 + 各頁 `lg:` 分支）、心情欄位與內文 emoji（Task 10）、S3 上傳（Task 6）、刪除確認（Task 10）、PWA 安裝（Task 1 設定 + Task 14）、Postgres jsonb（Task 4）、統計與匯出（Task 7、12、13）、主題深色（Task 1、8、13）全部有對應任務。搜尋框依規格「不做」，時間軸頁面未放。
- **Placeholder scan**：無 TBD；`#1`/`AB#1` 為明確標示的 commit 編號占位，執行前向使用者索取。
- **Type consistency**：`EntrySummary`、`Entry`、`Stats`、`TiptapDoc` 定義於 Task 3 `shared/types.ts`，後續 Task 5、7、9、10、11、12、13 皆以同名引用；`listEntryDates` 於 Task 5 定義、Task 7 使用；`useMonth` 於 Task 8 定義、Task 9、11、12 使用；`MonthCalendar` props `month/moods/today/size` 在 Task 9、10 一致。
