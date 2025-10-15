// components/notes/note-tags.tsx
// 노트 태그 표시 컴포넌트
// 태그를 배지 형식으로 표시하고 태그가 없는 경우 처리
// 관련 파일: lib/notes/queries.ts, app/notes/[id]/page.tsx

'use client'

import { Badge } from '@/components/ui/badge'
import { type NoteTag } from '@/lib/db/schema/notes'
import { TagsLoading } from './tags-loading'
import { TagsError } from './tags-error'

interface NoteTagsProps {
  tags: NoteTag[]
  isLoading?: boolean
  error?: string
  onRetry?: () => void
  className?: string
}

export function NoteTags({ 
  tags, 
  isLoading = false, 
  error, 
  onRetry, 
  className = '' 
}: NoteTagsProps) {
  // 로딩 상태
  if (isLoading) {
    return <TagsLoading className={className} />
  }

  // 에러 상태
  if (error) {
    return <TagsError onRetry={onRetry} className={className} />
  }

  // 태그가 없는 경우
  if (!tags || tags.length === 0) {
    return (
      <div className={`text-sm text-muted-foreground ${className}`}>
        태그가 없습니다
      </div>
    )
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {tags.map((tag) => (
        <Badge
          key={tag.id}
          variant="secondary"
          className="text-xs px-2 py-1 hover:bg-secondary/80 transition-colors cursor-pointer"
          title={`${tag.tag} 태그로 필터링`}
        >
          {tag.tag}
        </Badge>
      ))}
    </div>
  )
}
