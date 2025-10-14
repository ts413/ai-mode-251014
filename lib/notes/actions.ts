'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createNoteSupabase } from '@/lib/db/supabase-db'
import { insertNoteSchema } from '@/lib/db/schema/notes'
import { z } from 'zod'
import { db } from '@/lib/db/connection'
import { notes, summaries, noteTags } from '@/lib/db/schema/notes'
import { eq } from 'drizzle-orm'
import { generateContent, createSummaryPrompt, createTagPrompt } from '@/lib/ai/gemini'

export async function createNote(formData: FormData) {
    const supabase = await createClient()

    // 사용자 인증 확인
    const {
        data: { user },
        error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
        redirect('/signin')
    }

    // 폼 데이터 추출
    const title = formData.get('title') as string
    const content = formData.get('content') as string

    // 데이터 검증
    const validatedData = insertNoteSchema.parse({
        userId: user.id,
        title: title.trim() || '제목 없음',
        content: content.trim() || null
    })

    try {
        // Supabase 직접 연결로 노트 생성
        const result = await createNoteSupabase({
            user_id: user.id,
            title: validatedData.title,
            content: validatedData.content
        })
        console.log('노트 생성 성공:', result)

        // 캐시 무효화
        revalidatePath('/notes')
    } catch (error) {
        console.error('노트 생성 실패 - 상세 에러:', error)
        
        // 더 구체적인 에러 메시지 제공
        if (error instanceof Error) {
            console.error('에러 메시지:', error.message)
            console.error('에러 스택:', error.stack)
        }
        
        throw new Error(`노트 저장에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
    }

    // 성공 시 노트 목록 페이지로 리다이렉트
    redirect('/notes')
}

// 노트 업데이트 스키마
const updateNoteSchema = z.object({
    title: z.string().min(1, '제목은 필수입니다').optional(),
    content: z.string().optional()
})

export type UpdateNoteInput = z.infer<typeof updateNoteSchema>

export async function updateNote(
    noteId: string,
    data: UpdateNoteInput
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()

    // 사용자 인증 확인
    const {
        data: { user },
        error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
        return { success: false, error: '인증이 필요합니다' }
    }

    try {
        // 데이터 검증
        const validatedData = updateNoteSchema.parse(data)

        // 노트 소유자 확인
        const [existingNote] = await db
            .select()
            .from(notes)
            .where(eq(notes.id, noteId))
            .limit(1)

        if (!existingNote || existingNote.userId !== user.id) {
            return {
                success: false,
                error: '노트를 찾을 수 없거나 권한이 없습니다'
            }
        }

        // 업데이트할 데이터 준비
        const updateData: {
            updatedAt: Date
            title?: string
            content?: string | null
        } = {
            updatedAt: new Date()
        }

        if (validatedData.title !== undefined) {
            updateData.title = validatedData.title.trim() || '제목 없음'
        }

        if (validatedData.content !== undefined) {
            updateData.content = validatedData.content.trim() || null
        }

        // 노트 업데이트
        await db.update(notes).set(updateData).where(eq(notes.id, noteId))

        // 캐시 무효화
        revalidatePath('/notes')
        revalidatePath(`/notes/${noteId}`)

        return { success: true }
    } catch (error) {
        console.error('노트 업데이트 실패:', error)

        if (error instanceof z.ZodError) {
            return { success: false, error: '입력 데이터가 올바르지 않습니다' }
        }

        return { success: false, error: '노트 저장에 실패했습니다' }
    }
}

export async function deleteNote(noteId: string): Promise<{
    success: boolean
    error?: string
}> {
    const supabase = await createClient()

    // 사용자 인증 확인
    const {
        data: { user },
        error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
        return { success: false, error: '인증이 필요합니다' }
    }

    try {
        // 노트 소유자 확인
        const [existingNote] = await db
            .select()
            .from(notes)
            .where(eq(notes.id, noteId))
            .limit(1)

        if (!existingNote) {
            return { success: false, error: '노트를 찾을 수 없습니다' }
        }

        if (existingNote.userId !== user.id) {
            return { success: false, error: '이 노트를 삭제할 권한이 없습니다' }
        }

        // 노트 삭제
        await db.delete(notes).where(eq(notes.id, noteId))

        // 캐시 무효화
        revalidatePath('/notes')
        revalidatePath(`/notes/${noteId}`)

        return { success: true }
    } catch (error) {
        console.error('노트 삭제 실패:', error)
        return { success: false, error: '노트 삭제에 실패했습니다' }
    }
}

// AI 요약 및 태그 재생성 함수
export async function regenerateAI(noteId: string): Promise<{
    success: boolean
    error?: string
    summary?: string
    tags?: string[]
}> {
    const supabase = await createClient()

    // 사용자 인증 확인
    const {
        data: { user },
        error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
        return { success: false, error: '인증이 필요합니다' }
    }

    try {
        // 노트 소유자 확인 및 내용 가져오기
        const [note] = await db
            .select()
            .from(notes)
            .where(eq(notes.id, noteId))
            .limit(1)

        if (!note || note.userId !== user.id) {
            return { success: false, error: '노트를 찾을 수 없거나 권한이 없습니다' }
        }

        if (!note.content) {
            return { success: false, error: 'AI 처리를 위한 노트 내용이 없습니다' }
        }

        // 기존 요약 및 태그 삭제
        await db.delete(summaries).where(eq(summaries.noteId, noteId))
        await db.delete(noteTags).where(eq(noteTags.noteId, noteId))

        // AI 요약 생성
        const summaryPrompt = createSummaryPrompt(note.content)
        const summaryContent = await generateContent(summaryPrompt)

        // AI 태그 생성
        const tagPrompt = createTagPrompt(note.content)
        const tagContent = await generateContent(tagPrompt)
        
        // 태그 파싱 (쉼표로 구분된 태그들을 배열로 변환)
        const tagsArray = tagContent
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0)
            .slice(0, 6) // 최대 6개 태그로 제한

        // 요약 저장
        await db.insert(summaries).values({
            noteId: noteId,
            model: 'gemini-2.0-flash-001',
            content: summaryContent
        })

        // 태그 저장
        if (tagsArray.length > 0) {
            await db.insert(noteTags).values(
                tagsArray.map(tag => ({
                    noteId: noteId,
                    tag: tag
                }))
            )
        }

        // 캐시 무효화
        revalidatePath('/notes')
        revalidatePath(`/notes/${noteId}`)

        return {
            success: true,
            summary: summaryContent,
            tags: tagsArray
        }
    } catch (error) {
        console.error('AI 처리 실패:', error)
        
        let errorMessage = 'AI 처리에 실패했습니다'
        
        if (error instanceof Error) {
            if (error.message.includes('토큰 제한')) {
                errorMessage = '노트 내용이 너무 깁니다. 내용을 줄여주세요.'
            } else if (error.message.includes('API 키')) {
                errorMessage = 'AI 서비스 설정에 문제가 있습니다.'
            } else {
                errorMessage = `AI 처리 중 오류가 발생했습니다: ${error.message}`
            }
        }

        return { success: false, error: errorMessage }
    }
}
