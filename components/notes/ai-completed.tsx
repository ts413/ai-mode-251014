// components/notes/ai-completed.tsx
// AI 처리 완료 상태 컴포넌트
// AI 요약/태그 생성이 완료되었을 때 표시되는 성공 메시지
// 관련 파일: components/notes/ai-status.tsx, app/notes/[id]/page.tsx

'use client'

import { CheckCircle, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'

interface AICompletedProps {
  message?: string
  showPreview?: boolean
  summary?: string
  tags?: string[]
  autoHide?: boolean
  hideDelay?: number
  className?: string
}

export function AICompleted({ 
  message = "요약과 태그가 성공적으로 생성되었습니다!",
  showPreview = false,
  summary,
  tags = [],
  autoHide = true,
  hideDelay = 3000,
  className = '' 
}: AICompletedProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (autoHide) {
      const timer = setTimeout(() => {
        setIsVisible(false)
      }, hideDelay)

      return () => clearTimeout(timer)
    }
  }, [autoHide, hideDelay])

  if (!isVisible) {
    return null
  }

  return (
    <div className={`flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800 ${className}`}>
      {/* 성공 아이콘 */}
      <div className="flex-shrink-0">
        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
      </div>
      
      <div className="flex-1 min-w-0">
        {/* 성공 메시지 */}
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-4 w-4 text-green-600 dark:text-green-400" />
          <p className="text-sm font-medium text-green-800 dark:text-green-200">
            {message}
          </p>
        </div>
        
        {/* 미리보기 표시 (옵션) */}
        {showPreview && (summary || tags.length > 0) && (
          <div className="space-y-2">
            {/* 요약 미리보기 */}
            {summary && (
              <div className="text-xs text-green-700 dark:text-green-300">
                <span className="font-medium">요약:</span> {summary.substring(0, 100)}
                {summary.length > 100 && '...'}
              </div>
            )}
            
            {/* 태그 미리보기 */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                <span className="text-xs font-medium text-green-700 dark:text-green-300">태그:</span>
                {tags.slice(0, 3).map((tag, index) => (
                  <span 
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
                  >
                    {tag}
                  </span>
                ))}
                {tags.length > 3 && (
                  <span className="text-xs text-green-600 dark:text-green-400">
                    +{tags.length - 3}개 더
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
