'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, X, Clock } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { getSearchHistory, saveSearchHistory, clearSearchHistory } from '@/lib/notes/search'
import { useRouter, useSearchParams } from 'next/navigation'
import { useDebounce } from '@/lib/utils/debounce'

interface SearchInputProps {
    placeholder?: string
    className?: string
}

export function SearchInput({ 
    placeholder = "노트 검색...", 
    className = "" 
}: SearchInputProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [query, setQuery] = useState(searchParams.get('search') || '')
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [isSearching, setIsSearching] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)
    const suggestionsRef = useRef<HTMLDivElement>(null)

    // 현재 URL의 sort 파라미터 가져오기
    const currentSort = searchParams.get('sort') || 'newest'

    // debounce된 검색 함수
    const debouncedSearch = useDebounce(((searchQuery: string) => {
        if (searchQuery.trim()) {
            saveSearchHistory(searchQuery)
        }
        
        const params = new URLSearchParams(searchParams.toString())
        if (searchQuery.trim()) {
            params.set('search', searchQuery)
            params.set('page', '1') // 검색 시 첫 페이지로
        } else {
            params.delete('search')
        }
        
        router.replace(`/notes?${params.toString()}`)
        setIsSearching(false)
    }) as (searchQuery: string) => void, 300)

    // 검색어 변경 핸들러
    const handleQueryChange = (value: string) => {
        setQuery(value)
        setIsSearching(true)
        debouncedSearch(value)
    }

    // 검색어 지우기
    const handleClear = () => {
        setQuery('')
        setShowSuggestions(false)
        const params = new URLSearchParams(searchParams.toString())
        params.delete('search')
        params.set('page', '1')
        router.replace(`/notes?${params.toString()}`)
        inputRef.current?.focus()
    }

    // 검색 히스토리 가져오기
    const searchHistory = getSearchHistory()

    // 외부 클릭 시 자동완성 닫기
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                suggestionsRef.current && 
                !suggestionsRef.current.contains(event.target as Node) &&
                !inputRef.current?.contains(event.target as Node)
            ) {
                setShowSuggestions(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // 자동완성 항목 선택
    const handleSuggestionSelect = (suggestion: string) => {
        setQuery(suggestion)
        setShowSuggestions(false)
        handleQueryChange(suggestion)
    }

    // 히스토리 지우기
    const handleClearHistory = () => {
        clearSearchHistory()
        setShowSuggestions(false)
    }

    return (
        <div className={`relative ${className}`}>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                    ref={inputRef}
                    type="text"
                    placeholder={placeholder}
                    value={query}
                    onChange={(e) => handleQueryChange(e.target.value)}
                    onFocus={() => setShowSuggestions(true)}
                    className="pl-10 pr-10"
                />
                {query && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                        onClick={handleClear}
                    >
                        <X className="w-4 h-4" />
                    </Button>
                )}
            </div>

            {/* 자동완성 드롭다운 */}
            {showSuggestions && searchHistory.length > 0 && (
                <div
                    ref={suggestionsRef}
                    className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-50 mt-1"
                >
                    <div className="p-2 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 flex items-center">
                                <Clock className="w-4 h-4 mr-1" />
                                최근 검색어
                            </span>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={handleClearHistory}
                                className="text-xs text-gray-500 hover:text-gray-700"
                            >
                                지우기
                            </Button>
                        </div>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                        {searchHistory.slice(0, 5).map((suggestion, index) => (
                            <button
                                key={index}
                                type="button"
                                className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                                onClick={() => handleSuggestionSelect(suggestion)}
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
