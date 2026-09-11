# 紙頁日記

單人、一天一篇的 Nuxt 日記，支援心情 emoji、Tiptap 內文、S3 圖片與 PWA 安裝。

## 開發

```bash
npm install
copy .env.example .env
# 在 .env 填入 PostgreSQL 與 S3 設定
npm run db:migrate
npm run dev
```

沒有資料庫設定時，首頁仍可啟動並顯示設定提示；日記寫入與 API 需要有效的 `NUXT_DATABASE_URL`。

## 測試與驗證

```bash
npm test
npm run typecheck
npm run build

# 設定測試資料庫後執行 API e2e 測試
$env:DATABASE_URL_TEST = 'postgres://...'
npm run test:e2e
```

單元測試涵蓋日期、摘要、Tiptap 文件、連續書寫、心情統計與圖片 key；API e2e 測試涵蓋日記 CRUD、輸入驗證、統計與匯出。沒有 `DATABASE_URL_TEST` 時，API 測試會安全跳過並在測試報告中標示。

## PWA icon

```bash
npm run icons
```

## 設計稿

以瀏覽器開啟 `design/paper-journal.html` 檢視完整畫布；執行 `node design/build.mjs` 可重新產生設計畫板與 `canvas.json`。
