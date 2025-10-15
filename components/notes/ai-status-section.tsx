// components/notes/ai-status-section.tsx
// AI 상태 표시 섹션 컴포넌트
// 노트 상세 페이지에서 AI 처리 상태를 표시하는 클라이언트 컴포넌트
// 관련 파일: components/notes/ai-status.tsx, app/notes/[id]/page.tsx

'use client'

import { useState, useTransition } from 'react'
import { AIStatus } from './ai-status'
import { useAIStatus } from '@/lib/notes/hooks'
import { regenerateAI } from '@/lib/notes/actions'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'

interface AIStatusSectionProps {
  noteId: string
  initialSummary?: string | null
  initialTags?: Array<{ tag: string }>
  className?: string
}

export function AIStatusSection({ 
  noteId, 
  initialSummary, 
  initialTags = [], 
  className = '' 
}: AIStatusSectionProps) {
  const aiStatus = useAIStatus()
  const [isPending, startTransition] = useTransition()
  const [lastResult, setLastResult] = useState<{
    summary?: string
    tags?: string[]
  } | null>(null)

  const handleRegenerate = () => {
    startTransition(async () => {
      try {
        aiStatus.setLoading()
        const result = await regenerateAI(noteId)
        
        if (result.success) {
          aiStatus.setCompleted()
          setLastResult({
            summary: result.summary,
            tags: result.tags
          })
        } else {
          aiStatus.setError(result.error || 'AI 처리에 실패했습니다')
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
        aiStatus.setError(errorMessage)
      }
    })
  }

  const handleRetry = () => {
    aiStatus.reset()
    handleRegenerate()
  }

  // 현재 표시할 데이터 결정
  const currentSummary = lastResult?.summary || initialSummary
  const currentTags = lastResult?.tags || initialTags.map(t => t.tag)

  return (
    <div className={`space-y-4 ${className}`}>
      {/* AI 상태 표시 */}
      <AIStatus
        status={aiStatus.status}
        error={aiStatus.error}
        onRetry={handleRetry}
        loadingMessage="AI가 요약과 태그를 생성하고 있습니다..."
        completedMessage="요약과 태그가 성공적으로 생성되었습니다!"
        showPreview={true}
        summary={currentSummary || undefined}
        tags={currentTags}
        autoHide={true}
        hideDelay={5000}
        showDetails={process.env.NODE_ENV === 'development'}
      />
      
      {/* 재생성 버튼 */}
      {!aiStatus.isLoading && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRegenerate}
            disabled={isPending}
            className="h-8 px-3 text-xs"
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${isPending ? 'animate-spin' : ''}`} />
            AI 재생성
          </Button>
        </div>
      )}
    </div>
  )
}
