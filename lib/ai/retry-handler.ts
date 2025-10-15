// lib/ai/retry-handler.ts
// AI 에러 재시도 로직
// 지수 백오프를 사용한 재시도, 재시도 횟수 제한, 재시도 조건 분류
// 관련 파일: lib/ai/error-handler.ts, lib/ai/error-logger.ts

import { AIError, ErrorType, calculateRetryDelay } from './error-handler'

export interface RetryConfig {
  maxAttempts: number
  baseDelay: number
  maxDelay: number
  retryableErrors: ErrorType[]
}

export interface RetryResult<T> {
  success: boolean
  data?: T
  error?: AIError
  attempts: number
  totalTime: number
}

// 기본 재시도 설정
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000, // 1초
  maxDelay: 30000, // 30초
  retryableErrors: ['NETWORK_ERROR', 'API_ERROR', 'RATE_LIMIT_ERROR']
}

// 재시도 가능한 에러인지 확인
export function isRetryableError(error: AIError, config: RetryConfig = DEFAULT_RETRY_CONFIG): boolean {
  return config.retryableErrors.includes(error.type) && error.canRetry
}

// 재시도 지연 시간 계산
export function getRetryDelay(attempt: number, config: RetryConfig = DEFAULT_RETRY_CONFIG): number {
  const delay = calculateRetryDelay(attempt, config.baseDelay)
  return Math.min(delay, config.maxDelay)
}

// 재시도 로직 실행
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  onRetry?: (attempt: number, error: AIError) => void
): Promise<RetryResult<T>> {
  const startTime = Date.now()
  let lastError: AIError | undefined
  
  for (let attempt = 0; attempt < config.maxAttempts; attempt++) {
    try {
      const result = await operation()
      return {
        success: true,
        data: result,
        attempts: attempt + 1,
        totalTime: Date.now() - startTime
      }
    } catch (error) {
      const aiError = error instanceof Error ? 
        require('./error-handler').classifyError(error) : 
        { type: 'UNKNOWN_ERROR' as ErrorType, canRetry: false } as AIError
      
      lastError = aiError
      
      // 재시도 불가능한 에러인 경우 즉시 종료
      if (!isRetryableError(aiError, config)) {
        break
      }
      
      // 마지막 시도인 경우 종료
      if (attempt === config.maxAttempts - 1) {
        break
      }
      
      // 재시도 콜백 실행
      onRetry?.(attempt + 1, aiError)
      
      // 재시도 지연
      const delay = getRetryDelay(attempt, config)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  return {
    success: false,
    error: lastError,
    attempts: config.maxAttempts,
    totalTime: Date.now() - startTime
  }
}

// 재시도 상태 관리
export class RetryState {
  private attempts: number = 0
  private isRetrying: boolean = false
  private lastError: AIError | null = null
  
  get currentAttempts(): number {
    return this.attempts
  }
  
  get isCurrentlyRetrying(): boolean {
    return this.isRetrying
  }
  
  get hasError(): boolean {
    return this.lastError !== null
  }
  
  get lastErrorInfo(): AIError | null {
    return this.lastError
  }
  
  startRetry(): void {
    this.isRetrying = true
    this.attempts++
  }
  
  stopRetry(): void {
    this.isRetrying = false
  }
  
  setError(error: AIError): void {
    this.lastError = error
  }
  
  reset(): void {
    this.attempts = 0
    this.isRetrying = false
    this.lastError = null
  }
  
  getRetryProgress(): number {
    return Math.min((this.attempts / DEFAULT_RETRY_CONFIG.maxAttempts) * 100, 100)
  }
}

// 재시도 조건 분류
export function shouldRetry(error: AIError, attempt: number, maxAttempts: number): boolean {
  // 최대 시도 횟수 초과
  if (attempt >= maxAttempts) {
    return false
  }
  
  // 재시도 불가능한 에러
  if (!error.canRetry) {
    return false
  }
  
  // 심각도가 CRITICAL인 경우 재시도하지 않음
  if (error.severity === 'CRITICAL') {
    return false
  }
  
  // 특정 에러 타입별 재시도 조건
  switch (error.type) {
    case 'RATE_LIMIT_ERROR':
      // 속도 제한 에러는 재시도 간격을 더 길게
      return attempt < 2
    case 'NETWORK_ERROR':
      // 네트워크 에러는 더 많이 재시도
      return attempt < 5
    case 'API_ERROR':
      // API 에러는 적당히 재시도
      return attempt < 3
    default:
      return attempt < 2
  }
}

// 재시도 상태 표시를 위한 유틸리티
export function getRetryStatusMessage(state: RetryState): string {
  if (state.isCurrentlyRetrying) {
    return `재시도 중... (${state.currentAttempts}/${DEFAULT_RETRY_CONFIG.maxAttempts})`
  }
  
  if (state.hasError) {
    const error = state.lastErrorInfo!
    if (error.canRetry) {
      return `재시도 가능: ${error.userMessage}`
    } else {
      return `재시도 불가: ${error.userMessage}`
    }
  }
  
  return '정상'
}
