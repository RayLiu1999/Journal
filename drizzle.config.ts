import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'postgresql',
  schema: './server/db/schema.ts',
  out: './drizzle',
  dbCredentials: {
    // A placeholder keeps `db:generate` usable before a local .env exists.
    // `db:migrate` still requires the real NUXT_DATABASE_URL.
    url: process.env.NUXT_DATABASE_URL || 'postgres://user:pass@localhost:5432/journal',
  },
})
