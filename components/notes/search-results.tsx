'use client'

import { Search, FileText } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { HighlightText } from './highlight-text'
import type { Note } from '@/lib/db/schema/notes'

interface SearchResultsProps {
    notes: Note[]
    searchQuery: string
    totalCount: number
    isLoading?: boolean
}

export function SearchResults({ 
    notes, 
    searchQuery, 
    totalCount, 
    isLoading = false 
}: SearchResultsProps) {
    if (isLoading) {
        return (
            <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, index) => (
                    <Card key={index} className="animate-pulse">
                        <CardContent className="p-4">
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        )
    }

    if (!searchQuery.trim()) {
        return null
    }

    if (notes.length === 0) {
        return (
            <Card>
                <CardContent className="py-16">
                    <div className="text-center">
                        <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            검색 결과가 없습니다
                        </h3>
                        <p className="text-gray-500 mb-4">
                            "<span className="font-medium">{searchQuery}</span>"에 대한 검색 결과를 찾을 수 없습니다.
                        </p>
                        <div className="text-sm text-gray-400">
                            <p>• 다른 검색어를 시도해보세요</p>
                            <p>• 검색어의 철자를 확인해보세요</p>
                            <p>• 더 일반적인 단어로 검색해보세요</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            {/* 검색 결과 헤더 */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <Search className="w-5 h-5 text-gray-500" />
                    <span className="text-sm text-gray-600">
                        "<span className="font-medium">{searchQuery}</span>"에 대한 검색 결과
                    </span>
                </div>
                <span className="text-sm text-gray-500">
                    총 {totalCount}개
                </span>
            </div>

            {/* 검색 결과 목록 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {notes.map(note => (
                    <Card key={note.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                            <div className="space-y-3">
                                {/* 제목 */}
                                <div>
                                    <h3 className="font-medium text-gray-900 line-clamp-2">
                                        <HighlightText 
                                            text={note.title} 
                                            highlight={searchQuery}
                                        />
                                    </h3>
                                </div>

                                {/* 내용 미리보기 */}
                                {note.content && (
                                    <div className="text-sm text-gray-600 line-clamp-3">
                                        <HighlightText 
                                            text={note.content} 
                                            highlight={searchQuery}
                                        />
                                    </div>
                                )}

                                {/* 메타 정보 */}
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                    <div className="flex items-center space-x-1">
                                        <FileText className="w-3 h-3" />
                                        <span>노트</span>
                                    </div>
                                    <span>
                                        {new Date(note.updatedAt).toLocaleDateString('ko-KR')}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
