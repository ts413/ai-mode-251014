// components/notes/editable-summary.tsx
// 편집 가능한 요약 컴포넌트
// 인라인 편집, 실시간 미리보기, 편집 이력 표시 기능
// 관련 파일: components/notes/editable-content.tsx, app/notes/[id]/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { useEditableContent } from '@/lib/notes/hooks'
import { updateSummary } from '@/lib/notes/actions'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Edit2, Save, X, Loader2, History } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface EditableSummaryProps {
  noteId: string
  initialSummary?: string | null
  onSummaryChange?: (summary: string) => void
  className?: string
}

export function EditableSummary({
  noteId,
  initialSummary,
  onSummaryChange,
  className = ''
}: EditableSummaryProps) {
  const [isManualEdit, setIsManualEdit] = useState(false)
  
  const editableContent = useEditableContent(
    initialSummary || '',
    async (newSummary: string) => {
      try {
        const result = await updateSummary(noteId, newSummary)
        if (result.success) {
          setIsManualEdit(true)
          onSummaryChange?.(newSummary)
          return true
        } else {
          throw new Error(result.error || '요약 저장에 실패했습니다')
        }
      } catch (error) {
        console.error('요약 저장 실패:', error)
        return false
      }
    }
  )

  // 초기값 업데이트
  useEffect(() => {
    if (initialSummary !== undefined) {
      editableContent.updateInitialValue(initialSummary || '')
    }
  }, [initialSummary, editableContent]) // 실제 값만 의존성으로 사용

  // 편집 모드가 아닐 때
  if (!editableContent.isEditing) {
    return (
      <div className={`space-y-3 ${className}`}>
        {/* 요약 내용 */}
        <div className="relative group">
          <div className="p-4 bg-muted/50 rounded-lg border min-h-[100px]">
            {editableContent.value ? (
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {editableContent.value}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                요약이 없습니다. 클릭하여 요약을 추가하세요.
              </p>
            )}
          </div>
          
          {/* 편집 버튼 */}
          <Button
            variant="ghost"
            size="sm"
            onClick={editableContent.startEditing}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          
          {/* 수동 편집 표시 */}
          {isManualEdit && (
            <Badge variant="secondary" className="absolute bottom-2 right-2 text-xs">
              <History className="h-3 w-3 mr-1" />
              수동 편집
            </Badge>
          )}
        </div>
      </div>
    )
  }

  // 편집 모드일 때
  return (
    <div className={`space-y-3 ${className}`}>
      {/* 에러 메시지 */}
      {editableContent.error && (
        <Alert variant="destructive">
          <AlertDescription>{editableContent.error}</AlertDescription>
        </Alert>
      )}
      
      {/* 편집 영역 */}
      <div className="space-y-2">
        <Textarea
          value={editableContent.value}
          onChange={(e) => editableContent.updateValue(e.target.value)}
          placeholder="요약을 입력하세요..."
          className="min-h-[100px] resize-none"
          disabled={editableContent.isSaving}
        />
        
        {/* 문자 수 표시 */}
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <span>{editableContent.value.length}/1000자</span>
          {editableContent.hasChanges && (
            <span className="text-amber-600">변경사항 있음</span>
          )}
        </div>
      </div>
      
      {/* 편집 버튼들 */}
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={editableContent.cancelEditing}
          disabled={editableContent.isSaving}
        >
          <X className="h-3 w-3 mr-1" />
          취소
        </Button>
        
        <Button
          size="sm"
          onClick={editableContent.saveEditing}
          disabled={editableContent.isSaving || !editableContent.hasChanges}
        >
          {editableContent.isSaving ? (
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          ) : (
            <Save className="h-3 w-3 mr-1" />
          )}
          저장
        </Button>
      </div>
    </div>
  )
}
