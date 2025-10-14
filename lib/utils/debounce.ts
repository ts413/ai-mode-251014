import { useCallback, useRef } from 'react'

/**
 * debounce 훅
 * @param callback 실행할 함수
 * @param delay 지연 시간 (ms)
 * @returns debounced 함수
 */
export function useDebounce<T extends (...args: any[]) => any>(
    callback: T,
    delay: number
): T {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)

    const debouncedCallback = useCallback(
        (...args: any[]) => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }

            timeoutRef.current = setTimeout(() => {
                callback(...args)
            }, delay)
        },
        [callback, delay]
    ) as T

    return debouncedCallback
}