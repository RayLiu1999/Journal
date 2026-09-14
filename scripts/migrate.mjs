import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'

const url = process.env.NUXT_DATABASE_URL

if (!url) {
  throw new Error('NUXT_DATABASE_URL is not set')
}

const sql = postgres(url, { max: 1 })

try {
  await migrate(drizzle(sql), { migrationsFolder: './drizzle' })
  console.log('Database migrations completed.')
} finally {
  await sql.end({ timeout: 5 })
}
