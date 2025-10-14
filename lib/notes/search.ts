// lib/notes/search.ts
// 검색 관련 유틸리티 함수들

/**
 * 검색어 하이라이트를 위한 텍스트 처리
 */
export function highlightText(text: string, highlight: string): string {
    if (!highlight.trim() || !text) return text

    const regex = new RegExp(`(${escapeRegExp(highlight)})`, 'gi')
    return text.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>')
}

/**
 * 정규식 특수문자 이스케이프
 */
function escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * 검색 히스토리 관리
 */
const SEARCH_HISTORY_KEY = 'note-search-history'
const MAX_HISTORY_SIZE = 10

export function getSearchHistory(): string[] {
    if (typeof window === 'undefined') return []
    
    try {
        const history = localStorage.getItem(SEARCH_HISTORY_KEY)
        return history ? JSON.parse(history) : []
    } catch {
        return []
    }
}

export function saveSearchHistory(query: string): void {
    if (typeof window === 'undefined' || !query.trim()) return
    
    try {
        const history = getSearchHistory()
        const newHistory = [query, ...history.filter(item => item !== query)].slice(0, MAX_HISTORY_SIZE)
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory))
    } catch {
        // localStorage 오류 시 무시
    }
}

export function clearSearchHistory(): void {
    if (typeof window === 'undefined') return
    
    try {
        localStorage.removeItem(SEARCH_HISTORY_KEY)
    } catch {
        // localStorage 오류 시 무시
    }
}

/**
 * 검색어 유효성 검사
 */
export function isValidSearchQuery(query: string): boolean {
    return query.trim().length >= 1
}

/**
 * 검색어 정규화
 */
export function normalizeSearchQuery(query: string): string {
    return query.trim().toLowerCase()
}
