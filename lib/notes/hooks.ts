// lib/notes/hooks.ts
// 노트 관련 React 훅들
// AI 처리 상태 관리 및 노트 편집 상태 관리
// 관련 파일: components/notes/ai-status.tsx, components/notes/note-editor.tsx

'use client'

import { useState, useCallback, useEffect } from 'react'
import { updateNote } from '@/lib/notes/actions'

// AI 처리 상태 타입
export type AIStatus = 'IDLE' | 'LOADING' | 'COMPLETED' | 'ERROR'

// AI 상태 관리 훅
export function useAIStatus() {
  const [status, setStatus] = useState<AIStatus>('IDLE')
  const [error, setError] = useState<string | null>(null)

  const setLoading = useCallback(() => {
    setStatus('LOADING')
    setError(null)
  }, [])

  const setCompleted = useCallback(() => {
    setStatus('COMPLETED')
    setError(null)
  }, [])

  const setErrorStatus = useCallback((errorMessage: string) => {
    setStatus('ERROR')
    setError(errorMessage)
  }, [])

  const reset = useCallback(() => {
    setStatus('IDLE')
    setError(null)
  }, [])

  return {
    status,
    error,
    setLoading,
    setCompleted,
    setError: setErrorStatus,
    reset,
    isLoading: status === 'LOADING',
    isCompleted: status === 'COMPLETED',
    isError: status === 'ERROR',
    isIdle: status === 'IDLE'
  }
}

// AI 처리 함수 래퍼
export function useAIProcessor<T extends any[], R>(
  processor: (...args: T) => Promise<R>
) {
  const aiStatus = useAIStatus()

  const process = useCallback(async (...args: T): Promise<R | null> => {
    try {
      aiStatus.setLoading()
      const result = await processor(...args)
      aiStatus.setCompleted()
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
      aiStatus.setError(errorMessage)
      return null
    }
  }, [processor, aiStatus])

  return {
    ...aiStatus,
    process
  }
}

// 편집 가능한 콘텐츠 훅
export function useEditableContent<T>(
  initialValue: T,
  onSave?: (value: T) => Promise<boolean>,
  onCancel?: () => void
) {
  const [isEditing, setIsEditing] = useState(false)
  const [value, setValue] = useState<T>(initialValue)
  const [originalValue, setOriginalValue] = useState<T>(initialValue)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 편집 모드 시작
  const startEditing = useCallback(() => {
    setOriginalValue(value)
    setIsEditing(true)
    setError(null)
  }, [value])

  // 편집 모드 종료
  const stopEditing = useCallback(() => {
    setIsEditing(false)
    setError(null)
  }, [])

  // 편집 취소
  const cancelEditing = useCallback(() => {
    setValue(originalValue)
    setIsEditing(false)
    setError(null)
    onCancel?.()
  }, [originalValue, onCancel])

  // 편집 저장
  const saveEditing = useCallback(async () => {
    if (!onSave) {
      setIsEditing(false)
      return
    }

    try {
      setIsSaving(true)
      setError(null)
      
      const success = await onSave(value)
      
      if (success) {
        setOriginalValue(value)
        setIsEditing(false)
      } else {
        setError('저장에 실패했습니다')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '저장 중 오류가 발생했습니다'
      setError(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }, [value, onSave])

  // 값 변경
  const updateValue = useCallback((newValue: T) => {
    setValue(newValue)
    setError(null)
  }, [])

  // 초기값 업데이트 (외부에서 값이 변경된 경우)
  const updateInitialValue = useCallback((newValue: T) => {
    setValue(newValue)
    setOriginalValue(newValue)
    setIsEditing(false)
    setError(null)
  }, [])

  return {
    isEditing,
    value,
    originalValue,
    isSaving,
    error,
    startEditing,
    stopEditing,
    cancelEditing,
    saveEditing,
    updateValue,
    updateInitialValue,
    hasChanges: JSON.stringify(value) !== JSON.stringify(originalValue)
  }
}

// 자동 저장 훅
export function useAutoSave<T>(
  value: T,
  onSave: (value: T) => Promise<void>,
  delay: number = 1000
) {
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  const save = useCallback(async (currentValue: T) => {
    try {
      setIsSaving(true)
      setError(null)
      await onSave(currentValue)
      setLastSaved(new Date())
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '자동 저장 중 오류가 발생했습니다'
      setError(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }, [onSave])

  return {
    isSaving,
    lastSaved,
    error,
    save
  }
}

// 노트 편집용 자동 저장 훅
export function useNoteAutoSave({
  noteId,
  initialTitle,
  initialContent
}: {
  noteId: string
  initialTitle: string
  initialContent: string
}) {
  const [title, setTitle] = useState(initialTitle)
  const [content, setContent] = useState(initialContent)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 제목 변경 핸들러
  const handleTitleChange = useCallback((newTitle: string) => {
    setTitle(newTitle)
    setHasChanges(true)
    setSaveStatus('idle')
  }, [])

  // 내용 변경 핸들러
  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent)
    setHasChanges(true)
    setSaveStatus('idle')
  }, [])

  // 즉시 저장
  const saveImmediately = useCallback(async () => {
    if (!hasChanges) return

    try {
      setSaveStatus('saving')
      setError(null)

      const result = await updateNote(noteId, { title, content })
      
      if (result.success) {
        setSaveStatus('saved')
        setLastSavedAt(new Date())
        setHasChanges(false)
      } else {
        setError(result.error || '저장에 실패했습니다')
        setSaveStatus('error')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '저장에 실패했습니다'
      setError(errorMessage)
      setSaveStatus('error')
    }
  }, [noteId, title, content, hasChanges])

  // 자동 저장 (3초 후)
  useEffect(() => {
    if (!hasChanges) return

    const timer = setTimeout(() => {
      saveImmediately()
    }, 3000)

    return () => clearTimeout(timer)
  }, [hasChanges, saveImmediately])

  return {
    title,
    content,
    saveStatus,
    lastSavedAt,
    hasChanges,
    error,
    handleTitleChange,
    handleContentChange,
    saveImmediately
  }
}