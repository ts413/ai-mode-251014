// components/notes/regenerate-ai.tsx
// AI 재생성 통합 컴포넌트
// 재생성 옵션과 버튼을 통합하여 관리하는 메인 컴포넌트
// 관련 파일: components/notes/regenerate-button.tsx, components/notes/regenerate-options.tsx

'use client'

import { useState, useTransition } from 'react'
import { RegenerateOptions, type RegenerateType } from './regenerate-options'
import { RegenerateButton } from './regenerate-button'
import { regenerateAI, regenerateSummary, regenerateTags, getUserRegenerationCount } from '@/lib/notes/actions'
import { useAIStatus } from '@/lib/notes/hooks'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info, AlertTriangle } from 'lucide-react'

interface RegenerateAIProps {
  noteId: string
  onSuccess?: (result: { summary?: string; tags?: string[] }) => void
  onError?: (error: string) => void
  showLimitInfo?: boolean
  className?: string
}

export function RegenerateAI({
  noteId,
  onSuccess,
  onError,
  showLimitInfo = true,
  className = ''
}: RegenerateAIProps) {
  const [isPending, startTransition] = useTransition()
  const [regenerationCount, setRegenerationCount] = useState<{
    currentCount: number
    limit: number
    canRegenerate: boolean
  } | null>(null)
  
  const aiStatus = useAIStatus()

  // 재생성 횟수 조회
  const fetchRegenerationCount = async () => {
    try {
      console.log('재생성 횟수 조회 시작')
      const count = await getUserRegenerationCount()
      console.log('재생성 횟수 조회 결과:', count)
      setRegenerationCount(count)
      return count
    } catch (error) {
      console.error('재생성 횟수 조회 실패:', error)
      // 에러 시에도 기본값 반환
      const defaultCount = { currentCount: 0, limit: 10, canRegenerate: true }
      setRegenerationCount(defaultCount)
      return defaultCount
    }
  }

  // 재생성 처리 함수
  const handleRegenerate = async (type: RegenerateType) => {
    console.log('재생성 시작:', { type, noteId })
    
    // 재생성 횟수 확인 (임시로 비활성화)
    // const count = await fetchRegenerationCount()
    // console.log('재생성 횟수 체크 결과:', count)
    
    // if (count && !count.canRegenerate) {
    //   console.log('재생성 제한에 도달:', count)
    //   onError?.(`일일 재생성 횟수 제한에 도달했습니다. (${count.currentCount}/${count.limit})`)
    //   return
    // }

    startTransition(async () => {
      try {
        console.log('AI 상태를 로딩으로 설정')
        aiStatus.setLoading()
        
        console.log('재생성 함수 호출:', type)
        let result
        switch (type) {
          case 'summary':
            console.log('요약 재생성 호출')
            result = await regenerateSummary(noteId)
            break
          case 'tags':
            console.log('태그 재생성 호출')
            result = await regenerateTags(noteId)
            break
          case 'both':
            console.log('전체 재생성 호출')
            result = await regenerateAI(noteId)
            break
          default:
            throw new Error('알 수 없는 재생성 타입입니다')
        }
        
        console.log('재생성 결과:', result)

        if (result.success) {
          aiStatus.setCompleted()
          onSuccess?.({
            summary: result.summary,
            tags: result.tags
          })
          // 재생성 횟수 업데이트
          await fetchRegenerationCount()
        } else {
          aiStatus.setError(result.error || '재생성에 실패했습니다')
          onError?.(result.error || '재생성에 실패했습니다')
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
        aiStatus.setError(errorMessage)
        onError?.(errorMessage)
      }
    })
  }

  // 재생성 횟수 정보 표시
  const renderLimitInfo = () => {
    if (!showLimitInfo || !regenerationCount) return null

    const { currentCount, limit, canRegenerate } = regenerationCount
    const isNearLimit = currentCount >= limit * 0.8

    if (!canRegenerate) {
      return (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            일일 재생성 횟수 제한에 도달했습니다. ({currentCount}/{limit})
            <br />
            내일 다시 시도해주세요.
          </AlertDescription>
        </Alert>
      )
    }

    if (isNearLimit) {
      return (
        <Alert className="mb-4">
          <Info className="h-4 w-4" />
          <AlertDescription>
            재생성 횟수가 거의 소진되었습니다. ({currentCount}/{limit})
          </AlertDescription>
        </Alert>
      )
    }

    return null
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 재생성 횟수 정보 */}
      {renderLimitInfo()}
      
      {/* 재생성 옵션 */}
      <div className="flex justify-end">
        <RegenerateOptions
          onRegenerate={handleRegenerate}
          isLoading={isPending || aiStatus.isLoading}
          disabled={regenerationCount?.canRegenerate === false}
        />
      </div>
    </div>
  )
}
