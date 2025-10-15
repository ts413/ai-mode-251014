// components/notes/ai-error.tsx
// AI 처리 실패 시 에러 상태 컴포넌트
// AI 요약/태그 생성이 실패했을 때 표시되는 에러 메시지 및 재시도 기능
// 관련 파일: components/notes/ai-status.tsx, app/notes/[id]/page.tsx

'use client'

import { AlertCircle, RefreshCw, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

interface AIErrorProps {
  error: string
  onRetry?: () => void
  showDetails?: boolean
  className?: string
}

export function AIError({ 
  error, 
  onRetry, 
  showDetails = false,
  className = '' 
}: AIErrorProps) {
  const [showFullError, setShowFullError] = useState(false)

  // 에러 메시지 분류 및 사용자 친화적 메시지 생성
  const getErrorMessage = (error: string) => {
    if (error.includes('토큰 제한')) {
      return {
        title: '내용이 너무 깁니다',
        description: '노트 내용을 줄여서 다시 시도해주세요.',
        suggestion: '긴 내용은 여러 개의 노트로 나누어 작성해보세요.'
      }
    }
    
    if (error.includes('API 키') || error.includes('인증')) {
      return {
        title: 'AI 서비스 연결 오류',
        description: 'AI 서비스에 연결할 수 없습니다.',
        suggestion: '잠시 후 다시 시도해주세요.'
      }
    }
    
    if (error.includes('네트워크') || error.includes('연결')) {
      return {
        title: '네트워크 연결 오류',
        description: '인터넷 연결을 확인해주세요.',
        suggestion: '네트워크가 안정적인 환경에서 다시 시도해주세요.'
      }
    }
    
    return {
      title: 'AI 처리 실패',
      description: '요약과 태그 생성에 실패했습니다.',
      suggestion: '잠시 후 다시 시도해주세요.'
    }
  }

  const errorInfo = getErrorMessage(error)

  return (
    <div className={`flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800 ${className}`}>
      {/* 에러 아이콘 */}
      <div className="flex-shrink-0">
        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
      </div>
      
      <div className="flex-1 min-w-0">
        {/* 에러 제목 */}
        <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
          {errorInfo.title}
        </h4>
        
        {/* 에러 설명 */}
        <p className="text-sm text-red-700 dark:text-red-300 mb-2">
          {errorInfo.description}
        </p>
        
        {/* 제안사항 */}
        <p className="text-xs text-red-600 dark:text-red-400 mb-3">
          💡 {errorInfo.suggestion}
        </p>
        
        {/* 재시도 버튼 */}
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="h-8 px-3 text-xs border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            다시 시도
          </Button>
        )}
        
        {/* 상세 에러 정보 (개발 모드) */}
        {showDetails && (
          <details className="mt-3">
            <summary className="text-xs text-red-600 dark:text-red-400 cursor-pointer hover:text-red-700 dark:hover:text-red-300 flex items-center gap-1">
              <Info className="h-3 w-3" />
              기술적 세부사항 보기
            </summary>
            <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/30 rounded text-xs font-mono text-red-800 dark:text-red-200 break-all">
              {error}
            </div>
          </details>
        )}
      </div>
    </div>
  )
}
