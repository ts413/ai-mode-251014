'use client'

import { highlightText } from '@/lib/notes/search'

interface HighlightTextProps {
    text: string
    highlight: string
    className?: string
}

export function HighlightText({ 
    text, 
    highlight, 
    className = "" 
}: HighlightTextProps) {
    if (!highlight.trim() || !text) {
        return <span className={className}>{text}</span>
    }

    const highlightedHtml = highlightText(text, highlight)
    
    return (
        <span 
            className={className}
            dangerouslySetInnerHTML={{ __html: highlightedHtml }}
        />
    )
}
