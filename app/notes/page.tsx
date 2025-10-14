import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Plus, Home } from 'lucide-react'
import Link from 'next/link'
import { NotesSortControl } from '@/components/notes/notes-sort'
import { NotesList } from '@/components/notes/notes-list'
import { SearchInput } from '@/components/notes/search-input'
import { SearchResults } from '@/components/notes/search-results'
import { getUserNotesPaginatedSupabase } from '@/lib/db/supabase-db'

export type NotesSort = 'newest' | 'oldest' | 'title'

// Supabase 직접 연결을 사용한 노트 조회 함수
async function getUserNotesSupabase(userId: string, sort: NotesSort = 'newest') {
    const supabase = await createClient()
    
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
        const { data, error } = await supabase
            .from('notes')
            .select('*')
            .eq('user_id', userId)
            .order(orderBy, { ascending })

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

// 검색 함수
async function searchUserNotesSupabase(userId: string, query: string, sort: NotesSort = 'newest') {
    const supabase = await createClient()
    
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
        const { data, error } = await supabase
            .from('notes')
            .select('*')
            .eq('user_id', userId)
            .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
            .order(orderBy, { ascending })

        if (error) {
            console.error('노트 검색 실패:', error)
            return []
        }

        return data || []
    } catch (error) {
        console.error('노트 검색 실패 - 상세 에러:', error)
        return []
    }
}

export default async function NotesPage({
    searchParams
}: {
    searchParams: Promise<{ page?: string; sort?: string; search?: string }>
}) {
    // 로그인 확인
    const supabase = await createClient()
    const {
        data: { user },
        error
    } = await supabase.auth.getUser()

    if (error || !user) {
        redirect('/signin')
    }

    // URL 파라미터 파싱
    const PAGE_SIZE = 12
    const params = await searchParams
    const currentPage = Math.max(1, parseInt(params?.page || '1', 10) || 1)
    const sortParam = (params?.sort || 'newest') as NotesSort
    const searchQuery = params?.search || ''

    // Supabase 직접 연결로 노트 조회
    let notes = []
    let totalCount = 0
    
    try {
        if (searchQuery.trim()) {
            // 검색의 경우 모든 결과를 가져와서 클라이언트에서 페이지네이션
            const allNotes = await searchUserNotesSupabase(user.id, searchQuery, sortParam)
            totalCount = allNotes.length
            const startIndex = (currentPage - 1) * PAGE_SIZE
            const endIndex = startIndex + PAGE_SIZE
            notes = allNotes.slice(startIndex, endIndex)
        } else {
            // 일반 조회의 경우 서버에서 페이지네이션
            const result = await getUserNotesPaginatedSupabase(user.id, currentPage, PAGE_SIZE, sortParam)
            notes = result.notes
            totalCount = result.totalCount
        }
    } catch (error) {
        console.error('노트 조회 실패:', error)
        notes = []
        totalCount = 0
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* 헤더 */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            내 노트
                        </h1>
                        <p className="text-gray-600 mt-1">
                            총 {totalCount}개의 노트
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/">
                            <Button variant="outline">
                                <Home className="w-4 h-4 mr-2" />홈으로
                            </Button>
                        </Link>
                        <Link href="/notes/new">
                            <Button>
                                <Plus className="w-4 h-4 mr-2" />새 노트 작성
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* 검색 및 정렬 컨트롤 */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="flex-1">
                        <SearchInput />
                    </div>
                    <div className="flex items-center">
                        <NotesSortControl currentSort={sortParam} />
                    </div>
                </div>

                {/* 검색 결과 또는 노트 목록 */}
                {searchQuery.trim() ? (
                    <SearchResults 
                        notes={notes} 
                        searchQuery={searchQuery}
                        totalCount={totalCount}
                    />
                ) : (
                    <NotesList initialNotes={notes} />
                )}

                {/* 페이지네이션 */}
                {totalCount > PAGE_SIZE && (
                    <div className="flex items-center justify-center mt-8 gap-2">
                        <Link
                            href={`/notes?page=${Math.max(
                                1,
                                currentPage - 1
                            )}&sort=${sortParam}${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''}`}
                        >
                            <Button
                                variant="outline"
                                disabled={currentPage === 1}
                            >
                                이전
                            </Button>
                        </Link>
                        {Array.from(
                            {
                                length: Math.max(
                                    1,
                                    Math.ceil(totalCount / PAGE_SIZE)
                                )
                            },
                            (_, idx) => idx + 1
                        ).map(pageNum => {
                            const href = `/notes?page=${pageNum}&sort=${sortParam}${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''}`
                            const isActive = pageNum === currentPage
                            return (
                                <Link key={pageNum} href={href}>
                                    <Button
                                        variant={
                                            isActive ? 'default' : 'outline'
                                        }
                                        className="min-w-10"
                                    >
                                        {pageNum}
                                    </Button>
                                </Link>
                            )
                        })}
                        <Link
                            href={`/notes?page=${
                                currentPage + 1
                            }&sort=${sortParam}${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''}`}
                        >
                            <Button
                                variant="outline"
                                disabled={
                                    currentPage >=
                                    Math.ceil(totalCount / PAGE_SIZE)
                                }
                            >
                                다음
                            </Button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}

export const metadata = {
    title: '노트 목록 - AI 메모장',
    description: '내가 작성한 노트들을 확인하세요'
}
