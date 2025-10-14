import * as React from 'react'

export function Skeleton({ className = '' }: { className?: string }) {
    return (
        <div
            className={`animate-pulse rounded-md bg-gray-200 dark:bg-gray-800 ${className}`}
        />
    )
}
