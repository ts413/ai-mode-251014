import { createClient } from '@/lib/supabase/server'

// Supabase 클라이언트를 사용한 데이터베이스 연결
export async function getSupabaseDB() {
    const supabase = await createClient()
    return supabase
}

// 사용자 노트 조회 (Supabase 직접 사용)
export async function getUserNotesSupabase() {
    const supabase = await getSupabaseDB()
    
    const {
        data: { user },
        error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
        console.error('사용자 인증 실패:', authError)
        return []
    }

    try {
        const { data, error } = await supabase
            .from('notes')
            .select('*')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false })

        if (error) {
            console.error('노트 조회 실패:', error)
            return []
        }

        return data || []
    } catch (error) {
        console.error('노트 조회 실패 - 상세 에러:', error)
        return []
    }
}

// 페이지네이션을 지원하는 노트 조회
export async function getUserNotesPaginatedSupabase(
    userId: string, 
    page: number = 1, 
    limit: number = 12, 
    sort: 'newest' | 'oldest' | 'title' = 'newest'
) {
    const supabase = await getSupabaseDB()
    
    let orderBy = 'updated_at'
    let ascending = false
    
    switch (sort) {
        case 'oldest':
            orderBy = 'updated_at'
            ascending = true
            break
        case 'title':
            orderBy = 'title'
            ascending = true
            break
        case 'newest':
        default:
            orderBy = 'updated_at'
            ascending = false
            break
    }

    try {
        const from = (page - 1) * limit
        const to = from + limit - 1

        const { data, error, count } = await supabase
            .from('notes')
            .select('*', { count: 'exact' })
            .eq('user_id', userId)
            .order(orderBy, { ascending })
            .range(from, to)

        if (error) {
            console.error('노트 조회 실패:', error)
            return { notes: [], totalCount: 0 }
        }

        return { 
            notes: data || [], 
            totalCount: count || 0 
        }
    } catch (error) {
        console.error('노트 조회 실패 - 상세 에러:', error)
        return { notes: [], totalCount: 0 }
    }
}

// 노트 생성 (Supabase 직접 사용)
export async function createNoteSupabase(noteData: {
    user_id: string
    title: string
    content?: string | null
}) {
    const supabase = await getSupabaseDB()

    try {
        // UUID 생성
        const id = crypto.randomUUID()
        
        const { data, error } = await supabase
            .from('notes')
            .insert([{
                id: id,
                user_id: noteData.user_id,
                title: noteData.title,
                content: noteData.content
            }])
            .select()
            .single()

        if (error) {
            console.error('Supabase 노트 생성 실패:', error)
            throw new Error(`노트 저장에 실패했습니다: ${error.message}`)
        }

        return data
    } catch (error) {
        console.error('노트 생성 실패 - 상세 에러:', error)
        if (error instanceof Error) {
            throw error
        }
        throw new Error('노트 저장에 실패했습니다. 다시 시도해주세요.')
    }
}
