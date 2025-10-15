// components/notes/ai-loading.tsx
// AI 처리 중 로딩 상태 컴포넌트
// AI가 요약/태그를 생성하는 동안 표시되는 로딩 인디케이터
// 관련 파일: components/notes/ai-status.tsx, app/notes/[id]/page.tsx

'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { Loader2 } from 'lucide-react'

interface AILoadingProps {
  message?: string
  showProgress?: boolean
  progress?: number
  className?: string
}

export function AILoading({ 
  message = "AI가 요약과 태그를 생성하고 있습니다...", 
  showProgress = false,
  progress = 0,
  className = '' 
}: AILoadingProps) {
  return (
    <div className={`flex items-center gap-3 p-4 bg-muted/50 rounded-lg border ${className}`}>
      {/* 로딩 스피너 */}
      <Loader2 className="h-5 w-5 animate-spin text-primary" />
      
      <div className="flex-1">
        {/* 로딩 메시지 */}
        <p className="text-sm font-medium text-foreground">
          {message}
        </p>
        
        {/* 진행률 표시 (옵션) */}
        {showProgress && (
          <div className="mt-2">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>진행률</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
          </div>
        )}
      </div>
      
      {/* 스켈레톤 미리보기 */}
      <div className="hidden sm:flex gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-14 rounded-full" />
      </div>
    </div>
  )
}
