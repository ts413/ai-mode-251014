// components/notes/ai-error-display.tsx
// AI 에러 표시 컴포넌트
// 에러 유형별 UI, 재시도 버튼, 대안 제시 기능
// 관련 파일: lib/ai/error-handler.ts, lib/ai/retry-handler.ts

'use client'

import { useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  XCircle, 
  RefreshCw, 
  Clock, 
  ExternalLink,
  HelpCircle
} from 'lucide-react'
import { AIError, getErrorColor, getErrorIcon } from '@/lib/ai/error-handler'
import { RetryState } from '@/lib/ai/retry-handler'

interface AIErrorDisplayProps {
  error: AIError
  onRetry?: () => void
  onDismiss?: () => void
  showDetails?: boolean
  className?: string
}

export function AIErrorDisplay({
  error,
  onRetry,
  onDismiss,
  showDetails = false,
  className = ''
}: AIErrorDisplayProps) {
  const [isRetrying, setIsRetrying] = useState(false)
  const [showFullDetails, setShowFullDetails] = useState(false)

  const handleRetry = async () => {
    if (!onRetry || !error.canRetry) return
    
    setIsRetrying(true)
    try {
      await onRetry()
    } finally {
      setIsRetrying(false)
    }
  }

  const getErrorIconComponent = (severity: string) => {
    const iconClass = "h-4 w-4"
    
    switch (severity) {
      case 'CRITICAL':
        return <XCircle className={`${iconClass} text-red-600`} />
      case 'HIGH':
        return <AlertTriangle className={`${iconClass} text-orange-600`} />
      case 'MEDIUM':
        return <AlertCircle className={`${iconClass} text-yellow-600`} />
      case 'LOW':
        return <Info className={`${iconClass} text-blue-600`} />
      default:
        return <HelpCircle className={`${iconClass} text-gray-600`} />
    }
  }

  const getErrorVariant = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'destructive'
      case 'HIGH':
        return 'destructive'
      case 'MEDIUM':
        return 'default'
      case 'LOW':
        return 'default'
      default:
        return 'default'
    }
  }

  return (
    <Alert variant={getErrorVariant(error.severity)} className={className}>
      <div className="flex items-start gap-3">
        {/* 에러 아이콘 */}
        {getErrorIconComponent(error.severity)}
        
        <div className="flex-1 min-w-0">
          {/* 에러 메시지 */}
          <AlertDescription className="text-sm font-medium mb-2">
            {error.userMessage}
          </AlertDescription>
          
          {/* 에러 타입 및 심각도 */}
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="outline" className="text-xs">
              {error.type.replace('_', ' ')}
            </Badge>
            <Badge 
              variant="secondary" 
              className={`text-xs ${getErrorColor(error.severity)}`}
            >
              {error.severity}
            </Badge>
          </div>
          
          {/* 대안 제시 */}
          {error.alternative && (
            <div className="text-xs text-muted-foreground mb-3">
              💡 {error.alternative}
            </div>
          )}
          
          {/* 재시도 정보 */}
          {error.canRetry && error.retryAfter && (
            <div className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {error.retryAfter}초 후 재시도 가능
            </div>
          )}
          
          {/* 상세 정보 (개발 모드) */}
          {showDetails && (
            <details className="mb-3">
              <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                기술적 세부사항 보기
              </summary>
              <div className="mt-2 p-2 bg-muted rounded text-xs font-mono text-muted-foreground break-all">
                <div><strong>원본 에러:</strong> {error.message}</div>
                <div><strong>에러 타입:</strong> {error.type}</div>
                <div><strong>재시도 가능:</strong> {error.canRetry ? '예' : '아니오'}</div>
                {error.retryAfter && (
                  <div><strong>재시도 대기:</strong> {error.retryAfter}초</div>
                )}
              </div>
            </details>
          )}
          
          {/* 액션 버튼들 */}
          <div className="flex items-center gap-2">
            {/* 재시도 버튼 */}
            {error.canRetry && onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetry}
                disabled={isRetrying}
                className="h-7 px-2 text-xs"
              >
                {isRetrying ? (
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3 mr-1" />
                )}
                {isRetrying ? '재시도 중...' : '재시도'}
              </Button>
            )}
            
            {/* 닫기 버튼 */}
            {onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismiss}
                className="h-7 px-2 text-xs"
              >
                <XCircle className="h-3 w-3 mr-1" />
                닫기
              </Button>
            )}
            
            {/* 도움말 링크 */}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => window.open('/help/ai-errors', '_blank')}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              도움말
            </Button>
          </div>
        </div>
      </div>
    </Alert>
  )
}

// 에러 상태 표시 컴포넌트
interface ErrorStatusProps {
  retryState: RetryState
  onRetry?: () => void
  className?: string
}

export function ErrorStatus({ retryState, onRetry, className = '' }: ErrorStatusProps) {
  if (!retryState.hasError) {
    return null
  }

  const error = retryState.lastErrorInfo!
  
  return (
    <div className={`space-y-2 ${className}`}>
      <AIErrorDisplay
        error={error}
        onRetry={onRetry}
        showDetails={true}
      />
      
      {/* 재시도 진행률 */}
      {retryState.isCurrentlyRetrying && (
        <div className="text-xs text-muted-foreground">
          재시도 진행률: {retryState.getRetryProgress().toFixed(0)}%
        </div>
      )}
    </div>
  )
}

// 에러 요약 컴포넌트
interface ErrorSummaryProps {
  errors: AIError[]
  onRetryAll?: () => void
  onDismissAll?: () => void
  className?: string
}

export function ErrorSummary({ 
  errors, 
  onRetryAll, 
  onDismissAll, 
  className = '' 
}: ErrorSummaryProps) {
  if (errors.length === 0) {
    return null
  }

  const criticalErrors = errors.filter(e => e.severity === 'CRITICAL')
  const highErrors = errors.filter(e => e.severity === 'HIGH')
  const canRetryAll = errors.some(e => e.canRetry)

  return (
    <div className={`space-y-3 ${className}`}>
      {/* 에러 요약 */}
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">
          {errors.length}개의 에러가 발생했습니다
        </div>
        <div className="flex items-center gap-2">
          {criticalErrors.length > 0 && (
            <Badge variant="destructive" className="text-xs">
              심각: {criticalErrors.length}
            </Badge>
          )}
          {highErrors.length > 0 && (
            <Badge variant="outline" className="text-xs">
              높음: {highErrors.length}
            </Badge>
          )}
        </div>
      </div>
      
      {/* 액션 버튼들 */}
      <div className="flex items-center gap-2">
        {canRetryAll && onRetryAll && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetryAll}
            className="h-7 px-2 text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            모두 재시도
          </Button>
        )}
        
        {onDismissAll && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismissAll}
            className="h-7 px-2 text-xs"
          >
            <XCircle className="h-3 w-3 mr-1" />
            모두 닫기
          </Button>
        )}
      </div>
    </div>
  )
}
