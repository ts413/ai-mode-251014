// components/notes/tags-error.tsx
// 태그 생성 실패 시 에러 상태 컴포넌트
// AI 태그 생성이 실패했을 때 표시되는 에러 메시지
// 관련 파일: components/notes/note-tags.tsx, app/notes/[id]/page.tsx

'use client'

import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TagsErrorProps {
  onRetry?: () => void
  className?: string
}

export function TagsError({ onRetry, className = '' }: TagsErrorProps) {
  return (
    <div className={`flex items-center gap-2 text-sm text-destructive ${className}`}>
      <AlertCircle className="h-4 w-4" />
      <span>태그 생성에 실패했습니다</span>
      {onRetry && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRetry}
          className="h-6 px-2 text-xs"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          재시도
        </Button>
      )}
    </div>
  )
}
