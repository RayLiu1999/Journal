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
