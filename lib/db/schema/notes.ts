import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'

export const notes = pgTable('notes', {
    id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: uuid('user_id').notNull(),
    title: text('title').notNull().default('제목 없음'),
    content: text('content'),
    createdAt: timestamp('created_at', { withTimezone: true })
        .defaultNow()
        .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
        .defaultNow()
        .notNull()
})

// Zod 스키마 자동 생성
export const insertNoteSchema = createInsertSchema(notes, {
    title: z =>
        z
            .min(1, '제목을 입력해주세요')
            .max(200, '제목은 200자 이내로 입력해주세요'),
    content: z => z.max(50000, '내용은 50,000자 이내로 입력해주세요').optional()
})

export const selectNoteSchema = createSelectSchema(notes)

// AI 요약 테이블
export const summaries = pgTable('summaries', {
    id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    noteId: uuid('note_id').notNull().references(() => notes.id, { onDelete: 'cascade' }),
    model: text('model').notNull().default('gemini-2.0-flash-001'),
    content: text('content').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
        .defaultNow()
        .notNull()
})

// 노트 태그 테이블
export const noteTags = pgTable('note_tags', {
    id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    noteId: uuid('note_id').notNull().references(() => notes.id, { onDelete: 'cascade' }),
    tag: text('tag').notNull()
})

// Zod 스키마
export const insertSummarySchema = createInsertSchema(summaries)
export const insertNoteTagSchema = createInsertSchema(noteTags)

export type Note = typeof notes.$inferSelect
export type NewNote = typeof notes.$inferInsert
export type Summary = typeof summaries.$inferSelect
export type NewSummary = typeof summaries.$inferInsert
export type NoteTag = typeof noteTags.$inferSelect
export type NewNoteTag = typeof noteTags.$inferInsert
