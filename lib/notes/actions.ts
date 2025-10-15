'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createNoteSupabase } from '@/lib/db/supabase-db'
import { insertNoteSchema } from '@/lib/db/schema/notes'
import { z } from 'zod'
import { db } from '@/lib/db/server-connection'
import { notes, summaries, noteTags, aiRegenerations, editHistory } from '@/lib/db/schema/notes'
import { eq, and, gte, count } from 'drizzle-orm'
import { generateContent, createSummaryPrompt, createTagPrompt } from '@/lib/ai/gemini'
import { classifyError } from '@/lib/ai/error-handler'
import { executeWithRetry } from '@/lib/ai/retry-handler'
import { logError } from '@/lib/ai/error-logger'

// 최소 요약 생성 길이 (50자)
const MIN_SUMMARY_LENGTH = 50

// 재생성 횟수 제한 (일일)
const DAILY_REGENERATION_LIMIT = 10

// 재생성 횟수 확인 함수 (임시로 비활성화)
async function checkRegenerationLimit(userId: string): Promise<{
    canRegenerate: boolean
    currentCount: number
    limit: number
    error?: string
}> {
    // 임시로 비활성화 - ai_regenerations 테이블이 없어서 에러 발생
    return {
        canRegenerate: true,
        currentCount: 0,
        limit: DAILY_REGENERATION_LIMIT,
        error: undefined
    }
    
    // try {
    //     // 오늘 날짜의 시작 시간 계산
    //     const today = new Date()
    //     today.setHours(0, 0, 0, 0)
        
    //     // 오늘 재생성 횟수 조회
    //     const [result] = await db
    //         .select({ count: count() })
    //         .from(aiRegenerations)
    //         .where(
    //             and(
    //                 eq(aiRegenerations.userId, userId),
    //                 gte(aiRegenerations.createdAt, today)
    //             )
    //         )
        
    //     const currentCount = Number(result?.count) || 0
        
    //     // 디버깅 로그 (개발 환경에서만)
    //     if (process.env.NODE_ENV === 'development') {
    //         console.log('재생성 횟수 체크:', {
    //             userId,
    //             today: today.toISOString(),
    //             currentCount,
    //             limit: DAILY_REGENERATION_LIMIT,
    //             canRegenerate: currentCount < DAILY_REGENERATION_LIMIT
    //         })
    //     }
        
    //     return {
    //         canRegenerate: currentCount < DAILY_REGENERATION_LIMIT,
    //         currentCount,
    //         limit: DAILY_REGENERATION_LIMIT,
    //         error: currentCount >= DAILY_REGENERATION_LIMIT 
    //             ? `일일 재생성 횟수 제한에 도달했습니다. (${currentCount}/${DAILY_REGENERATION_LIMIT})`
    //             : undefined
    //     }
    // } catch (error) {
    //     console.error('재생성 횟수 확인 실패:', error)
    //     return {
    //         canRegenerate: false,
    //         currentCount: 0,
    //         limit: DAILY_REGENERATION_LIMIT,
    //         error: '재생성 횟수를 확인할 수 없습니다'
    //     }
    // }
}

// 재생성 횟수 조회 서버 액션
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
        return { currentCount: 0, limit: DAILY_REGENERATION_LIMIT, canRegenerate: false }
    }

    const result = await checkRegenerationLimit(user.id)
    return {
        currentCount: result.currentCount,
        limit: result.limit,
        canRegenerate: result.canRegenerate
    }
}

// 재생성 이력 저장 함수 (임시로 비활성화)
async function saveRegenerationHistory(
    noteId: string, 
    userId: string, 
    type: 'summary' | 'tags' | 'both'
): Promise<void> {
    // 임시로 비활성화 - ai_regenerations 테이블이 없어서 에러 발생
    return
    
    // try {
    //     await db.insert(aiRegenerations).values({
    //         noteId,
    //         userId,
    //         type
    //     })
    // } catch (error) {
    //     console.error('재생성 이력 저장 실패:', error)
    //     // 이력 저장 실패는 재생성을 막지 않음
    // }
}

// 자동 요약 생성 헬퍼 함수 (에러 처리 통합)
async function generateAutoSummary(noteId: string, content: string | null, userId?: string): Promise<void> {
    // 내용이 없거나 최소 길이 미만이면 스킵
    if (!content || content.trim().length < MIN_SUMMARY_LENGTH) {
        console.log(`요약 생성 스킵: 내용이 ${MIN_SUMMARY_LENGTH}자 미만입니다.`)
        return
    }

    try {
        // 기존 요약 삭제
        await db.delete(summaries).where(eq(summaries.noteId, noteId))

        // 재시도 로직을 사용한 AI 요약 생성
        const retryResult = await executeWithRetry(
            async () => {
                const summaryPrompt = createSummaryPrompt(content)
                return await generateContent(summaryPrompt)
            },
            {
                maxAttempts: 3,
                baseDelay: 1000,
                maxDelay: 10000,
                retryableErrors: ['API_ERROR', 'NETWORK_ERROR', 'RATE_LIMIT_ERROR']
            }
        )

        if (!retryResult.success) {
            // 에러 분류 및 로깅
            const aiError = retryResult.error!
            if (userId) {
                await logError(aiError, noteId, userId, retryResult.attempts)
            }
            console.error('자동 요약 생성 실패:', aiError.userMessage)
            return
        }

        // 요약 저장
        await db.insert(summaries).values({
            noteId: noteId,
            model: 'gemini-2.0-flash-001',
            content: retryResult.data
        })

        console.log('자동 요약 생성 성공:', noteId)
    } catch (error) {
        // 에러 분류 및 로깅
        const aiError = classifyError(error instanceof Error ? error : new Error('알 수 없는 오류'))
        if (userId) {
            await logError(aiError, noteId, userId)
        }
        console.error('자동 요약 생성 실패 (노트는 저장됨):', aiError.userMessage)
    }
}

// 자동 태그 생성 헬퍼 함수 (에러 처리 통합)
async function generateAutoTags(noteId: string, content: string | null, userId?: string): Promise<void> {
    // 내용이 없거나 최소 길이 미만이면 스킵
    if (!content || content.trim().length < MIN_SUMMARY_LENGTH) {
        console.log(`태그 생성 스킵: 내용이 ${MIN_SUMMARY_LENGTH}자 미만입니다.`)
        return
    }

    try {
        // 기존 태그 삭제
        await db.delete(noteTags).where(eq(noteTags.noteId, noteId))

        // 재시도 로직을 사용한 AI 태그 생성
        const retryResult = await executeWithRetry(
            async () => {
                const tagPrompt = createTagPrompt(content)
                return await generateContent(tagPrompt)
            },
            {
                maxAttempts: 3,
                baseDelay: 1000,
                maxDelay: 10000,
                retryableErrors: ['API_ERROR', 'NETWORK_ERROR', 'RATE_LIMIT_ERROR']
            }
        )

        if (!retryResult.success) {
            // 에러 분류 및 로깅
            const aiError = retryResult.error!
            if (userId) {
                await logError(aiError, noteId, userId, retryResult.attempts)
            }
            console.error('자동 태그 생성 실패:', aiError.userMessage)
            return
        }

        // 태그 파싱 및 정규화 (쉼표로 구분된 태그들을 배열로 변환)
        const tagsArray = retryResult.data
            .split(',')
            .map(tag => tag.trim().toLowerCase()) // 소문자로 정규화
            .filter(tag => tag.length > 0)
            .slice(0, 6) // 최대 6개 태그로 제한

        // 태그 저장
        if (tagsArray.length > 0) {
            await db.insert(noteTags).values(
                tagsArray.map(tag => ({
                    noteId: noteId,
                    tag: tag
                }))
            )
        }

        console.log('자동 태그 생성 성공:', noteId, tagsArray)
    } catch (error) {
        // 에러 분류 및 로깅
        const aiError = classifyError(error instanceof Error ? error : new Error('알 수 없는 오류'))
        if (userId) {
            await logError(aiError, noteId, userId)
        }
        console.error('자동 태그 생성 실패 (노트는 저장됨):', aiError.userMessage)
    }
}

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

    let noteId: string | undefined

    try {
        // Supabase 직접 연결로 노트 생성
        const result = await createNoteSupabase({
            user_id: user.id,
            title: validatedData.title,
            content: validatedData.content
        })
        console.log('노트 생성 성공:', result)
        
        noteId = result.id

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

    // 노트 생성 성공 후 자동 요약 및 태그 생성
    if (noteId) {
        await generateAutoSummary(noteId, validatedData.content, user.id)
        await generateAutoTags(noteId, validatedData.content, user.id)
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

        // 내용이 변경된 경우 자동 요약 및 태그 재생성
        if (updateData.content !== undefined) {
            await generateAutoSummary(noteId, updateData.content, user.id)
            await generateAutoTags(noteId, updateData.content, user.id)
        }

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
        // 재생성 횟수 제한 확인
        const limitCheck = await checkRegenerationLimit(user.id)
        if (!limitCheck.canRegenerate) {
            return { success: false, error: limitCheck.error }
        }

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

        // 재생성 이력 저장
        await saveRegenerationHistory(noteId, user.id, 'both')

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

// 요약만 재생성하는 함수
export async function regenerateSummary(noteId: string): Promise<{
    success: boolean
    error?: string
    summary?: string
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
        // 재생성 횟수 제한 확인
        const limitCheck = await checkRegenerationLimit(user.id)
        if (!limitCheck.canRegenerate) {
            return { success: false, error: limitCheck.error }
        }

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

        // 기존 요약만 삭제
        await db.delete(summaries).where(eq(summaries.noteId, noteId))

        // AI 요약 생성
        const summaryPrompt = createSummaryPrompt(note.content)
        const summaryContent = await generateContent(summaryPrompt)

        // 요약 저장
        await db.insert(summaries).values({
            noteId: noteId,
            model: 'gemini-2.0-flash-001',
            content: summaryContent
        })

        // 재생성 이력 저장
        await saveRegenerationHistory(noteId, user.id, 'summary')

        // 캐시 무효화
        revalidatePath('/notes')
        revalidatePath(`/notes/${noteId}`)

        return {
            success: true,
            summary: summaryContent
        }
    } catch (error) {
        console.error('요약 재생성 실패:', error)
        
        let errorMessage = '요약 재생성에 실패했습니다'
        
        if (error instanceof Error) {
            if (error.message.includes('토큰 제한')) {
                errorMessage = '노트 내용이 너무 깁니다. 내용을 줄여주세요.'
            } else if (error.message.includes('API 키')) {
                errorMessage = 'AI 서비스 설정에 문제가 있습니다.'
            } else {
                errorMessage = `요약 재생성 중 오류가 발생했습니다: ${error.message}`
            }
        }

        return { success: false, error: errorMessage }
    }
}

// 태그만 재생성하는 함수
export async function regenerateTags(noteId: string): Promise<{
    success: boolean
    error?: string
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
        // 재생성 횟수 제한 확인
        const limitCheck = await checkRegenerationLimit(user.id)
        if (!limitCheck.canRegenerate) {
            return { success: false, error: limitCheck.error }
        }

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

        // 기존 태그만 삭제
        await db.delete(noteTags).where(eq(noteTags.noteId, noteId))

        // AI 태그 생성
        const tagPrompt = createTagPrompt(note.content)
        const tagContent = await generateContent(tagPrompt)
        
        // 태그 파싱 및 정규화 (쉼표로 구분된 태그들을 배열로 변환)
        const tagsArray = tagContent
            .split(',')
            .map(tag => tag.trim().toLowerCase()) // 소문자로 정규화
            .filter(tag => tag.length > 0)
            .slice(0, 6) // 최대 6개 태그로 제한

        // 태그 저장
        if (tagsArray.length > 0) {
            await db.insert(noteTags).values(
                tagsArray.map(tag => ({
                    noteId: noteId,
                    tag: tag
                }))
            )
        }

        // 재생성 이력 저장
        await saveRegenerationHistory(noteId, user.id, 'tags')

        // 캐시 무효화
        revalidatePath('/notes')
        revalidatePath(`/notes/${noteId}`)

        return {
            success: true,
            tags: tagsArray
        }
    } catch (error) {
        console.error('태그 재생성 실패:', error)
        
        let errorMessage = '태그 재생성에 실패했습니다'
        
        if (error instanceof Error) {
            if (error.message.includes('토큰 제한')) {
                errorMessage = '노트 내용이 너무 깁니다. 내용을 줄여주세요.'
            } else if (error.message.includes('API 키')) {
                errorMessage = 'AI 서비스 설정에 문제가 있습니다.'
            } else {
                errorMessage = `태그 재생성 중 오류가 발생했습니다: ${error.message}`
            }
        }

        return { success: false, error: errorMessage }
    }
}

// 요약 수동 편집 함수
export async function updateSummary(
    noteId: string, 
    newContent: string
): Promise<{
    success: boolean
    error?: string
    summary?: string
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
        const [note] = await db
            .select()
            .from(notes)
            .where(eq(notes.id, noteId))
            .limit(1)

        if (!note || note.userId !== user.id) {
            return { success: false, error: '노트를 찾을 수 없거나 권한이 없습니다' }
        }

        // 요약 유효성 검증
        if (!newContent || newContent.trim().length === 0) {
            return { success: false, error: '요약 내용을 입력해주세요' }
        }

        if (newContent.length > 1000) {
            return { success: false, error: '요약은 1000자 이내로 입력해주세요' }
        }

        // 기존 요약 조회
        const [existingSummary] = await db
            .select()
            .from(summaries)
            .where(eq(summaries.noteId, noteId))
            .orderBy(desc(summaries.createdAt))
            .limit(1)

        // 요약 업데이트 또는 생성
        if (existingSummary) {
            // 편집 이력 저장
            await db.insert(editHistory).values({
                noteId: noteId,
                type: 'summary',
                isManualEdit: 'true',
                originalContent: existingSummary.content,
                editedContent: newContent.trim(),
                editedBy: user.id
            })

            // 요약 업데이트
            await db
                .update(summaries)
                .set({ 
                    content: newContent.trim(),
                    createdAt: new Date()
                })
                .where(eq(summaries.id, existingSummary.id))
        } else {
            // 새 요약 생성
            await db.insert(summaries).values({
                noteId: noteId,
                model: 'manual-edit',
                content: newContent.trim()
            })

            // 편집 이력 저장
            await db.insert(editHistory).values({
                noteId: noteId,
                type: 'summary',
                isManualEdit: 'true',
                originalContent: null,
                editedContent: newContent.trim(),
                editedBy: user.id
            })
        }

        // 캐시 무효화
        revalidatePath('/notes')
        revalidatePath(`/notes/${noteId}`)

        return {
            success: true,
            summary: newContent.trim()
        }
    } catch (error) {
        console.error('요약 편집 실패:', error)
        
        let errorMessage = '요약 편집에 실패했습니다'
        
        if (error instanceof Error) {
            errorMessage = `요약 편집 중 오류가 발생했습니다: ${error.message}`
        }

        return { success: false, error: errorMessage }
    }
}

// 태그 수동 편집 함수
export async function updateTags(
    noteId: string, 
    newTags: string[]
): Promise<{
    success: boolean
    error?: string
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
        // 노트 소유자 확인
        const [note] = await db
            .select()
            .from(notes)
            .where(eq(notes.id, noteId))
            .limit(1)

        if (!note || note.userId !== user.id) {
            return { success: false, error: '노트를 찾을 수 없거나 권한이 없습니다' }
        }

        // 태그 유효성 검증
        if (!Array.isArray(newTags)) {
            return { success: false, error: '태그는 배열 형태여야 합니다' }
        }

        if (newTags.length > 10) {
            return { success: false, error: '태그는 최대 10개까지 입력할 수 있습니다' }
        }

        // 태그 정규화 및 검증
        const normalizedTags = newTags
            .map(tag => tag.trim().toLowerCase())
            .filter(tag => tag.length > 0 && tag.length <= 50)
            .slice(0, 10)

        if (normalizedTags.length === 0) {
            return { success: false, error: '유효한 태그를 입력해주세요' }
        }

        // 기존 태그 조회
        const existingTags = await db
            .select()
            .from(noteTags)
            .where(eq(noteTags.noteId, noteId))

        // 편집 이력 저장
        await db.insert(editHistory).values({
            noteId: noteId,
            type: 'tags',
            isManualEdit: 'true',
            originalContent: existingTags.map(t => t.tag).join(', '),
            editedContent: normalizedTags.join(', '),
            editedBy: user.id
        })

        // 기존 태그 삭제
        await db.delete(noteTags).where(eq(noteTags.noteId, noteId))

        // 새 태그 저장
        if (normalizedTags.length > 0) {
            await db.insert(noteTags).values(
                normalizedTags.map(tag => ({
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
            tags: normalizedTags
        }
    } catch (error) {
        console.error('태그 편집 실패:', error)
        
        let errorMessage = '태그 편집에 실패했습니다'
        
        if (error instanceof Error) {
            errorMessage = `태그 편집 중 오류가 발생했습니다: ${error.message}`
        }

        return { success: false, error: errorMessage }
    }
}
