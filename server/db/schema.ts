import { date, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import type { TiptapDoc } from '#shared/types'

export const entries = pgTable('entries', {
  date: date('date').primaryKey(),
  mood: text('mood'),
  content: jsonb('content')
    .$type<TiptapDoc>()
    .notNull()
    .default({ type: 'doc', content: [] }),
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
