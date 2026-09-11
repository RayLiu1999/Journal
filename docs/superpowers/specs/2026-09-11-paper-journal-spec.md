# 紙頁日記 規格

日期：2026-09-11。本文件是 grill-me 訪談達成的共識，設計稿見 `design/paper-journal.html`（由 `design/build.mjs` 產生）。

## 產品定義

- 單人使用，無登入、註冊。
- 一天一篇，日期（`YYYY-MM-DD`，使用者本機時區）是主鍵。
- 每篇有一個「心情 emoji」欄位（可空），內文由 Tiptap 編輯，內文也可插入 emoji。
- 任何一天都可編輯與刪除；刪除需確認對話框。
- 圖片可上傳並插入內文，存於 S3 相容物件儲存。
- PWA 只做「加到主畫面」與全螢幕，不做離線。

## 畫面（6 個，手機 390 寬與桌機 1280 寬以上各一套）

| 路由 | 畫面 | 重點 |
|---|---|---|
| `/` | 月曆首頁 | 當月月曆，有日記的日期顯示心情 emoji，今天高亮；底部「今天的日記」摘要卡。桌機版右側是今日預覽欄。 |
| `/entry/[date]` | 編輯/閱讀頁 | 日期標題、心情選擇列、Tiptap 編輯區、工具列（標題/粗體/斜體/清單/引用/圖片/emoji）、自動儲存狀態、右上選單含刪除。桌機版左側是迷你月曆與最近三篇。 |
| `/entry/[date]`（無資料） | 空狀態 | 插畫、「這一天還是空白的」、心情選擇列、「開始寫這一天」按鈕。 |
| `/timeline` | 時間軸 | 當月由新到舊的卡片：日期、星期、emoji、兩行摘要、第一張圖。 |
| `/stats` | 統計 | 「本月寫了 N 天」「連續書寫 N 天」兩個數字，當月心情分布單色長條圖。 |
| `/settings` | 設定 | 外觀（淺色/深色/跟隨系統）、圖片儲存狀態與本月上傳張數、匯出 JSON、清除本機快取。 |

手機版底部四個分頁：月曆、時間軸、統計、設定。桌機版左側 232px 側欄，同四項加「寫今天的日記」按鈕。

## 視覺

- 溫暖紙質感。淺色：紙底 `#F4EDE0`、卡片 `#FCF9F3`、墨 `#2B231B`、次墨 `#7A6C5D`、淡墨 `#A89A8A`、線 `#E2D7C3`、強調赤陶 `#B4552F`、強調淡 `#F3E1D3`、今天 `#EBCDA9`、chip `#EFE6D6`。
- 深色（深咖啡）：紙底 `#241B15`、卡片 `#2F251E`、墨 `#F2E9DB`、次墨 `#B4A492`、淡墨 `#7E6F60`、線 `#43362C`、強調 `#DB8358`、強調淡 `#4A3325`、今天 `#5B4230`、chip `#3A2E25`。
- 字體：標題 Noto Serif TC，內文 Noto Sans TC（Google Fonts）。
- 圖示：描邊 SVG，不用 emoji 當圖示。心情 emoji 是內容，不是圖示。
- 觸控目標最小 44px。

## 技術

- Nuxt（最新穩定版，`app/` 目錄結構）、TypeScript、npm。
- Tailwind CSS v4（`@tailwindcss/vite`），色彩以 CSS 變數定義，深色模式用 `html[data-theme="dark"]`。
- Tiptap（`@tiptap/vue-3`、`@tiptap/starter-kit`、`@tiptap/extension-image`、`@tiptap/extension-placeholder`），內容以 Tiptap JSON 存 jsonb。
- emoji picker：`emoji-picker-element`（開源 web component），選取後插入編輯器游標處。
- PostgreSQL（既有實例）+ Drizzle ORM + `postgres` driver。
- S3 相容儲存：`@aws-sdk/client-s3`，後端代傳（multipart POST 到 `/api/upload`），回傳公開 URL。
- PWA：`@vite-pwa/nuxt`，只產 manifest 與 icon，`workbox` 不做 runtime cache。
- 測試：vitest。純函式單元測試；API 用 `@nuxt/test-utils/e2e` 對測試資料庫跑。

## 資料模型

```
entries
  date        date      PK
  mood        text      null
  content     jsonb     not null default '{"type":"doc","content":[]}'
  created_at  timestamptz not null default now()
  updated_at  timestamptz not null default now()

images
  id          uuid      PK default gen_random_uuid()
  key         text      not null unique   -- S3 object key
  url         text      not null
  entry_date  date      null references entries(date) on delete set null
  created_at  timestamptz not null default now()
```

## API

| 方法 | 路徑 | 說明 |
|---|---|---|
| GET | `/api/entries?month=YYYY-MM` | 該月摘要清單 `[{date, mood, excerpt, firstImageUrl}]`，由新到舊 |
| GET | `/api/entries/:date` | 單篇 `{date, mood, content, updatedAt}`，沒有回 404 |
| PUT | `/api/entries/:date` | upsert，body `{mood?: string|null, content?: object}`，回單篇 |
| DELETE | `/api/entries/:date` | 刪除，回 204 |
| POST | `/api/upload` | multipart `file`（image/*，≤10MB）+ 可選 `date`，回 `{url, key}` |
| GET | `/api/stats?month=YYYY-MM` | `{daysWritten, streak, moods: [{mood, count}], uploads}` |
| GET | `/api/export` | 所有日記 JSON 陣列 |

## 環境變數

```
DATABASE_URL=postgres://user:pass@host:5432/journal
S3_ENDPOINT=https://...
S3_REGION=auto
S3_BUCKET=journal
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_PUBLIC_BASE_URL=https://...   # 圖片公開 URL 前綴
```

## 不做（第一版）

- 離線寫入、同步佇列
- 多使用者、登入
- 全文搜尋（時間軸的搜尋框只是佔位，第一版不實作）
- i18n
