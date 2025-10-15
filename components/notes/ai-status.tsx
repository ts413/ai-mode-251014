// components/notes/ai-status.tsx
// AI 처리 상태 통합 컴포넌트
// 로딩, 완료, 에러 상태를 통합하여 관리하는 메인 컴포넌트
// 관련 파일: components/notes/ai-loading.tsx, components/notes/ai-completed.tsx, components/notes/ai-error.tsx

'use client'

import { AILoading } from './ai-loading'
import { AICompleted } from './ai-completed'
import { AIError } from './ai-error'
import { type AIStatus } from '@/lib/notes/hooks'

interface AIStatusProps {
  status: AIStatus
  error?: string | null
  onRetry?: () => void
  loadingMessage?: string
  completedMessage?: string
  showProgress?: boolean
  progress?: number
  showPreview?: boolean
  summary?: string
  tags?: string[]
  autoHide?: boolean
  hideDelay?: number
  showDetails?: boolean
  className?: string
}

export function AIStatus({
  status,
  error,
  onRetry,
  loadingMessage,
  completedMessage,
  showProgress = false,
  progress = 0,
  showPreview = false,
  summary,
  tags = [],
  autoHide = true,
  hideDelay = 3000,
  showDetails = false,
  className = ''
}: AIStatusProps) {
  // IDLE 상태일 때는 아무것도 표시하지 않음
  if (status === 'IDLE') {
    return null
  }

  // LOADING 상태
  if (status === 'LOADING') {
    return (
      <AILoading
        message={loadingMessage}
        showProgress={showProgress}
        progress={progress}
        className={className}
      />
    )
  }

  // COMPLETED 상태
  if (status === 'COMPLETED') {
    return (
      <AICompleted
        message={completedMessage}
        showPreview={showPreview}
        summary={summary}
        tags={tags}
        autoHide={autoHide}
        hideDelay={hideDelay}
        className={className}
      />
    )
  }

  // ERROR 상태
  if (status === 'ERROR' && error) {
    return (
      <AIError
        error={error}
        onRetry={onRetry}
        showDetails={showDetails}
        className={className}
      />
    )
  }

  return null
}
