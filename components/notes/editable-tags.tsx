// components/notes/editable-tags.tsx
// 편집 가능한 태그 컴포넌트
// 인라인 편집, 실시간 미리보기, 편집 이력 표시 기능
// 관련 파일: components/notes/editable-content.tsx, app/notes/[id]/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { useEditableContent } from '@/lib/notes/hooks'
import { updateTags } from '@/lib/notes/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Edit2, Save, X, Loader2, History, Plus, X as XIcon } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface EditableTagsProps {
  noteId: string
  initialTags?: Array<{ tag: string }>
  onTagsChange?: (tags: string[]) => void
  className?: string
}

export function EditableTags({
  noteId,
  initialTags = [],
  onTagsChange,
  className = ''
}: EditableTagsProps) {
  const [isManualEdit, setIsManualEdit] = useState(false)
  const [newTag, setNewTag] = useState('')
  
  const editableContent = useEditableContent(
    initialTags.map(t => t.tag),
    async (newTags: string[]) => {
      try {
        const result = await updateTags(noteId, newTags)
        if (result.success) {
          setIsManualEdit(true)
          onTagsChange?.(newTags)
          return true
        } else {
          throw new Error(result.error || '태그 저장에 실패했습니다')
        }
      } catch (error) {
        console.error('태그 저장 실패:', error)
        return false
      }
    }
  )

  // initialTags가 변경될 때만 업데이트
  useEffect(() => {
    const tagStrings = initialTags.map(t => t.tag)
    editableContent.updateInitialValue(tagStrings)
  }, [initialTags, editableContent.updateInitialValue])

  // 새 태그 추가
  const addTag = () => {
    if (!newTag.trim()) return
    
    const trimmedTag = newTag.trim().toLowerCase()
    if (!editableContent.value.includes(trimmedTag)) {
      editableContent.updateValue([...editableContent.value, trimmedTag])
    }
    setNewTag('')
  }

  // 태그 제거
  const removeTag = (tagToRemove: string) => {
    editableContent.updateValue(editableContent.value.filter(tag => tag !== tagToRemove))
  }

  // 키보드 이벤트 처리
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  // 편집 모드가 아닐 때
  if (!editableContent.isEditing) {
    return (
      <div className={`space-y-3 ${className}`}>
        {/* 태그 목록 */}
        <div className="relative group">
          <div className="p-4 bg-muted/50 rounded-lg border min-h-[60px]">
            {editableContent.value.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {editableContent.value.map((tag, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="text-xs px-2 py-1"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                태그가 없습니다. 클릭하여 태그를 추가하세요.
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
      <div className="space-y-3">
        {/* 기존 태그들 */}
        <div className="flex flex-wrap gap-2">
          {editableContent.value.map((tag, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="text-xs px-2 py-1 flex items-center gap-1"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5"
              >
                <XIcon className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        
        {/* 새 태그 입력 */}
        <div className="flex gap-2">
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="새 태그 입력..."
            className="flex-1"
            disabled={editableContent.isSaving}
          />
          <Button
            type="button"
            size="sm"
            onClick={addTag}
            disabled={!newTag.trim() || editableContent.isSaving}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
        
        {/* 태그 수 표시 */}
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <span>{editableContent.value.length}/10개 태그</span>
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
