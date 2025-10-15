// components/notes/tags-loading.tsx
// 태그 생성 중 로딩 상태 컴포넌트
// AI가 태그를 생성하는 동안 표시되는 로딩 인디케이터
// 관련 파일: components/notes/note-tags.tsx, app/notes/[id]/page.tsx

'use client'

import { Skeleton } from '@/components/ui/skeleton'

interface TagsLoadingProps {
  className?: string
}

export function TagsLoading({ className = '' }: TagsLoadingProps) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {/* 로딩 스켈레톤 배지들 */}
      {Array.from({ length: 3 }).map((_, index) => (
        <Skeleton
          key={index}
          className="h-6 w-16 rounded-full"
        />
      ))}
      <div className="text-sm text-muted-foreground flex items-center">
        AI가 태그를 생성하고 있습니다...
      </div>
    </div>
  )
}
