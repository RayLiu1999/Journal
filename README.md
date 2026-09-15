# 紙頁日記

單人、一天一篇的 Nuxt 日記，支援登入保護、心情 emoji、Tiptap 內文、S3 圖片與 PWA 安裝。

## 開發

```bash
npm install
copy .env.example .env
# 在 .env 填入 PostgreSQL、登入與 S3 設定
npm run db:migrate
npm run dev
```

`NUXT_AUTH_EMAIL`、`NUXT_AUTH_PASSWORD` 與至少 32 字元的 `NUXT_AUTH_SECRET` 是必要設定。可用下列指令產生 secret：

```bash
openssl rand -base64 48
```

這個版本採單一擁有者登入：帳號與密碼由環境變數設定，不開放公開註冊；登入後才能讀取頁面與 API。請勿將 `.env` 或實際密碼、secret 提交到 Git。登入設定不會新增或改動既有日記資料表。

## Docker Compose

Compose 只啟動 Nuxt app 與一次性的 migration container，PostgreSQL 使用既有的 `NUXT_DATABASE_URL`；S3/R2 則使用 `.env` 裡的 `NUXT_S3_*` 設定。

```bash
cp .env.example .env
# 修改 .env 裡的 NUXT_DATABASE_URL、NUXT_AUTH_* 與 S3/R2 設定
docker compose up --build -d
```

啟動時會先對既有資料庫執行 `drizzle` migration，成功後才啟動 app。網站預設在 <http://localhost:3000>。

`NUXT_DATABASE_URL` 必須使用 container 可連線的 host；若資料庫跑在本機，Docker Desktop/macOS 請使用 `host.docker.internal`，不要使用 `localhost`。

若使用 GHCR image，可指定 image 名稱與 tag：

```bash
IMAGE_NAME=ghcr.io/rayliu1999/journal IMAGE_TAG=latest docker compose pull
IMAGE_NAME=ghcr.io/rayliu1999/journal IMAGE_TAG=latest docker compose up -d
```

GitHub Actions 會在 `main` push 與 `v*` tag 時執行測試、typecheck、production build，並將 image 推送到 `ghcr.io/${{ github.repository }}`；Pull Request 只執行檢查，不會推送 image。

CI 會將測試分開：`unit` job 只跑 `tests/unit`，不連資料庫；`quality` job 才啟動隔離的測試 PostgreSQL 並執行 API e2e。

## 測試與驗證

```bash
npm run test:unit # 不需要資料庫
npm test
npm run typecheck
npm run build

# 設定測試資料庫後執行 API e2e 測試
$env:DATABASE_URL_TEST = 'postgres://...'
npm run test:e2e
```

單元測試涵蓋日期、摘要、Tiptap 文件、連續書寫、心情統計與圖片 key；API e2e 測試涵蓋登入保護、日記 CRUD、輸入驗證、統計與匯出。沒有 `DATABASE_URL_TEST` 時，資料庫 API 測試會安全跳過並在測試報告中標示，登入保護測試仍會執行。

## PWA icon

```bash
npm run icons
```

## 設計稿

以瀏覽器開啟 `design/paper-journal.html` 檢視完整畫布；執行 `node design/build.mjs` 可重新產生設計畫板與 `canvas.json`。
