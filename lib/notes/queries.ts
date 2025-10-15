import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db/server-connection'
import { notes, summaries, noteTags, aiRegenerations, type Note, type Summary, type NoteTag } from '@/lib/db/schema/notes'
import { eq, desc, asc, count, or, ilike, sql, and, gte } from 'drizzle-orm'

export async function getUserNotes() {
    const supabase = await createClient()

    const {
        data: { user },
        error
    } = await supabase.auth.getUser()

    if (error || !user) {
        console.error('사용자 인증 실패:', error)
        return []
    }

    try {
        const userNotes = await db
            .select()
            .from(notes)
            .where(eq(notes.userId, user.id))
            .orderBy(desc(notes.updatedAt))

        return userNotes
    } catch (error) {
        console.error('노트 조회 실패 - 상세 에러:', error)
        
        // 데이터베이스 연결 에러인지 확인
        if (error && typeof error === 'object' && 'code' in error) {
            console.error('데이터베이스 에러 코드:', error.code)
        }
        
        return []
    }
}

export async function getNoteById(noteId: string) {
    const supabase = await createClient()

    const {
        data: { user },
        error
    } = await supabase.auth.getUser()

    if (error || !user) {
        return null
    }

    try {
        const [note] = await db
            .select()
            .from(notes)
            .where(eq(notes.id, noteId))
            .limit(1)

        // 노트가 존재하고 사용자 소유인지 확인
        if (!note || note.userId !== user.id) {
            return null
        }

        return note
    } catch (error) {
        console.error('노트 조회 실패:', error)
        return null
    }
}

export type NotesSort = 'newest' | 'oldest' | 'title'

function resolveOrderBy(sort: NotesSort) {
    switch (sort) {
        case 'oldest':
            return asc(notes.updatedAt)
        case 'title':
            return asc(notes.title)
        case 'newest':
        default:
            return desc(notes.updatedAt)
    }
}

export async function getUserNotesPaginated({
    page,
    limit,
    sort
}: {
    page: number
    limit: number
    sort: NotesSort
}): Promise<{ notes: Note[]; totalCount: number }> {
    const supabase = await createClient()

    const {
        data: { user },
        error
    } = await supabase.auth.getUser()

    if (error || !user) {
        return { notes: [], totalCount: 0 }
    }

    const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1
    const safeLimit =
        Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 12
    const offset = (safePage - 1) * safeLimit

    try {
        const [rows, total] = await Promise.all([
            db
                .select()
                .from(notes)
                .where(eq(notes.userId, user.id))
                .orderBy(resolveOrderBy(sort))
                .limit(safeLimit)
                .offset(offset),
            db
                .select({ value: count() })
                .from(notes)
                .where(eq(notes.userId, user.id))
        ])

        const totalCount = Number(total?.[0]?.value ?? 0)
        return { notes: rows, totalCount }
    } catch (error) {
        console.error('노트 페이지네이션 조회 실패:', error)
        return { notes: [], totalCount: 0 }
    }
}

// 검색 기능을 위한 함수
export async function searchUserNotes({
    query,
    page,
    limit,
    sort
}: {
    query: string
    page: number
    limit: number
    sort: NotesSort
}): Promise<{ notes: Note[]; totalCount: number }> {
    const supabase = await createClient()

    const {
        data: { user },
        error
    } = await supabase.auth.getUser()

    if (error || !user) {
        return { notes: [], totalCount: 0 }
    }

    // 검색어가 없으면 기본 조회
    if (!query.trim()) {
        return getUserNotesPaginated({ page, limit, sort })
    }

    const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1
    const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 12
    const offset = (safePage - 1) * safeLimit
    const searchPattern = `%${query.trim()}%`

    try {
        // 검색 조건: 제목 또는 내용에서 검색
        const searchCondition = or(
            ilike(notes.title, searchPattern),
            ilike(notes.content, searchPattern)
        )

        // 제목 우선 정렬을 위한 CASE 문
        const titlePriority = sql<number>`CASE WHEN ${notes.title} ILIKE ${searchPattern} THEN 1 ELSE 2 END`

        const [rows, total] = await Promise.all([
            db
                .select()
                .from(notes)
                .where(and(eq(notes.userId, user.id), searchCondition))
                .orderBy(
                    titlePriority,
                    resolveOrderBy(sort)
                )
                .limit(safeLimit)
                .offset(offset),
            db
                .select({ value: count() })
                .from(notes)
                .where(and(eq(notes.userId, user.id), searchCondition))
        ])

        const totalCount = Number(total?.[0]?.value ?? 0)
        return { notes: rows, totalCount }
    } catch (error) {
        console.error('노트 검색 실패:', error)
        return { notes: [], totalCount: 0 }
    }
}

// 노트의 요약 조회
export async function getNoteSummary(noteId: string): Promise<Summary | null> {
    const supabase = await createClient()

    const {
        data: { user },
        error
    } = await supabase.auth.getUser()

    if (error || !user) {
        return null
    }

    try {
        // 노트 소유자 확인
        const [note] = await db
            .select()
            .from(notes)
            .where(eq(notes.id, noteId))
            .limit(1)

        if (!note || note.userId !== user.id) {
            return null
        }

        // 요약 조회
        const [summary] = await db
            .select()
            .from(summaries)
            .where(eq(summaries.noteId, noteId))
            .orderBy(desc(summaries.createdAt))
            .limit(1)

        return summary || null
    } catch (error) {
        console.error('요약 조회 실패:', error)
        return null
    }
}

// 노트와 요약을 함께 조회
export async function getNoteWithSummary(noteId: string): Promise<{ note: Note; summary: Summary | null } | null> {
    const supabase = await createClient()

    const {
        data: { user },
        error
    } = await supabase.auth.getUser()

    if (error || !user) {
        return null
    }

    try {
        // 노트 조회
        const [note] = await db
            .select()
            .from(notes)
            .where(eq(notes.id, noteId))
            .limit(1)

        if (!note || note.userId !== user.id) {
            return null
        }

        // 요약 조회
        const [summary] = await db
            .select()
            .from(summaries)
            .where(eq(summaries.noteId, noteId))
            .orderBy(desc(summaries.createdAt))
            .limit(1)

        return {
            note,
            summary: summary || null
        }
    } catch (error) {
        console.error('노트 및 요약 조회 실패:', error)
        return null
    }
}

// 노트의 태그 조회
export async function getNoteTags(noteId: string): Promise<NoteTag[]> {
    const supabase = await createClient()

    const {
        data: { user },
        error
    } = await supabase.auth.getUser()

    if (error || !user) {
        return []
    }

    try {
        // 노트 소유자 확인
        const [note] = await db
            .select()
            .from(notes)
            .where(eq(notes.id, noteId))
            .limit(1)

        if (!note || note.userId !== user.id) {
            return []
        }

        // 태그 조회
        const tags = await db
            .select()
            .from(noteTags)
            .where(eq(noteTags.noteId, noteId))
            .orderBy(asc(noteTags.tag))

        return tags
    } catch (error) {
        console.error('태그 조회 실패:', error)
        return []
    }
}

// 노트와 태그를 함께 조회
export async function getNoteWithTags(noteId: string): Promise<{ note: Note; tags: NoteTag[] } | null> {
    const supabase = await createClient()

    const {
        data: { user },
        error
    } = await supabase.auth.getUser()

    if (error || !user) {
        return null
    }

    try {
        // 노트 조회
        const [note] = await db
            .select()
            .from(notes)
            .where(eq(notes.id, noteId))
            .limit(1)

        if (!note || note.userId !== user.id) {
            return null
        }

        // 태그 조회
        const tags = await db
            .select()
            .from(noteTags)
            .where(eq(noteTags.noteId, noteId))
            .orderBy(asc(noteTags.tag))

        return {
            note,
            tags
        }
    } catch (error) {
        console.error('노트 및 태그 조회 실패:', error)
        return null
    }
}

// 노트와 요약, 태그를 함께 조회
export async function getNoteWithSummaryAndTags(noteId: string): Promise<{ note: Note; summary: Summary | null; tags: NoteTag[] } | null> {
    const supabase = await createClient()

    const {
        data: { user },
        error
    } = await supabase.auth.getUser()

    if (error || !user) {
        return null
    }

    try {
        // 노트 조회
        const [note] = await db
            .select()
            .from(notes)
            .where(eq(notes.id, noteId))
            .limit(1)

        if (!note || note.userId !== user.id) {
            return null
        }

        // 요약과 태그를 병렬로 조회
        const [summaryResult, tagsResult] = await Promise.all([
            db
                .select()
                .from(summaries)
                .where(eq(summaries.noteId, noteId))
                .orderBy(desc(summaries.createdAt))
                .limit(1),
            db
                .select()
                .from(noteTags)
                .where(eq(noteTags.noteId, noteId))
                .orderBy(asc(noteTags.tag))
        ])

        return {
            note,
            summary: summaryResult[0] || null,
            tags: tagsResult
        }
    } catch (error) {
        console.error('노트, 요약, 태그 조회 실패:', error)
        return null
    }
}

// 사용자별 재생성 횟수 조회
export async function getUserRegenerationCount(): Promise<{
    currentCount: number
    limit: number
    canRegenerate: boolean
}> {
    const supabase = await createClient()

    const {
        data: { user },
        error
    } = await supabase.auth.getUser()

    if (error || !user) {
        return { currentCount: 0, limit: 10, canRegenerate: false }
    }

    try {
        // 오늘 날짜의 시작 시간 계산
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        // 오늘 재생성 횟수 조회
        const [result] = await db
            .select({ count: count() })
            .from(aiRegenerations)
            .where(
                and(
                    eq(aiRegenerations.userId, user.id),
                    gte(aiRegenerations.createdAt, today)
                )
            )
        
        const currentCount = result?.count || 0
        const limit = 10 // 일일 제한
        
        return {
            currentCount,
            limit,
            canRegenerate: currentCount < limit
        }
    } catch (error) {
        console.error('재생성 횟수 조회 실패:', error)
        return { currentCount: 0, limit: 10, canRegenerate: false }
    }
}
