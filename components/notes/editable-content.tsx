// components/notes/editable-content.tsx
// 편집 UI 통합 컴포넌트
// 요약과 태그 편집을 통합하여 관리하는 메인 컴포넌트
// 관련 파일: components/notes/editable-summary.tsx, components/notes/editable-tags.tsx

'use client'

import { useState } from 'react'
import { EditableSummary } from './editable-summary'
import { EditableTags } from './editable-tags'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Edit3, Save, X, Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface EditableContentProps {
  noteId: string
  initialSummary?: string | null
  initialTags?: Array<{ tag: string }>
  onSummaryChange?: (summary: string) => void
  onTagsChange?: (tags: string[]) => void
  className?: string
  // 재생성 결과를 받을 수 있는 props
  regenerationResult?: {
    summary?: string
    tags?: string[]
  }
}

export function EditableContent({
  noteId,
  initialSummary,
  initialTags = [],
  onSummaryChange,
  onTagsChange,
  className = '',
  regenerationResult
}: EditableContentProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)

  // 편집 모드 시작
  const startEditing = () => {
    setIsEditing(true)
    setError(null)
  }

  // 편집 모드 종료
  const stopEditing = () => {
    setIsEditing(false)
    setError(null)
    setHasChanges(false)
  }

  // 변경사항 감지
  const handleSummaryChange = (summary: string) => {
    setHasChanges(true)
    onSummaryChange?.(summary)
  }

  const handleTagsChange = (tags: string[]) => {
    setHasChanges(true)
    onTagsChange?.(tags)
  }

  // 편집 모드가 아닐 때
  if (!isEditing) {
    return (
      <div className={`space-y-6 ${className}`}>
        {/* 요약 섹션 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-muted-foreground">요약</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={startEditing}
              className="h-8 px-3 text-xs"
            >
              <Edit3 className="h-3 w-3 mr-1" />
              편집
            </Button>
          </div>
          <EditableSummary
            noteId={noteId}
            initialSummary={regenerationResult?.summary || initialSummary}
            onSummaryChange={handleSummaryChange}
          />
        </div>

        {/* 태그 섹션 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-muted-foreground">태그</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={startEditing}
              className="h-8 px-3 text-xs"
            >
              <Edit3 className="h-3 w-3 mr-1" />
              편집
            </Button>
          </div>
          <EditableTags
            noteId={noteId}
            initialTags={regenerationResult?.tags ? regenerationResult.tags.map(tag => ({ tag })) : initialTags}
            onTagsChange={handleTagsChange}
          />
        </div>
      </div>
    )
  }

  // 편집 모드일 때
  return (
    <div className={`space-y-6 ${className}`}>
      {/* 에러 메시지 */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 요약 편집 섹션 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-muted-foreground">요약</h3>
          {hasChanges && (
            <Badge variant="outline" className="text-xs">
              변경사항 있음
            </Badge>
          )}
        </div>
        <EditableSummary
          noteId={noteId}
          initialSummary={initialSummary}
          onSummaryChange={handleSummaryChange}
        />
      </div>

      {/* 태그 편집 섹션 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-muted-foreground">태그</h3>
          {hasChanges && (
            <Badge variant="outline" className="text-xs">
              변경사항 있음
            </Badge>
          )}
        </div>
        <EditableTags
          noteId={noteId}
          initialTags={initialTags}
          onTagsChange={handleTagsChange}
        />
      </div>

      {/* 편집 컨트롤 */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button
          variant="outline"
          size="sm"
          onClick={stopEditing}
          disabled={isSaving}
        >
          <X className="h-3 w-3 mr-1" />
          편집 종료
        </Button>
        
        <Button
          size="sm"
          disabled={isSaving || !hasChanges}
          className="opacity-50 cursor-not-allowed"
        >
          {isSaving ? (
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          ) : (
            <Save className="h-3 w-3 mr-1" />
          )}
          저장 (개별 저장)
        </Button>
      </div>

      {/* 편집 안내 */}
      <Alert>
        <AlertDescription className="text-xs">
          💡 각 섹션에서 개별적으로 저장하세요. 요약과 태그는 독립적으로 편집됩니다.
        </AlertDescription>
      </Alert>
    </div>
  )
}
