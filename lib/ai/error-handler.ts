// lib/ai/error-handler.ts
// AI 에러 처리 및 분류 로직
// 에러 유형별 분류, 사용자 친화적 메시지 변환, 에러 심각도 분류
// 관련 파일: lib/ai/error-logger.ts, components/notes/ai-error-display.tsx

export type ErrorType = 'API_ERROR' | 'NETWORK_ERROR' | 'VALIDATION_ERROR' | 'RATE_LIMIT_ERROR' | 'AUTH_ERROR' | 'UNKNOWN_ERROR'

export type ErrorSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export interface AIError {
  type: ErrorType
  severity: ErrorSeverity
  message: string
  userMessage: string
  canRetry: boolean
  retryAfter?: number // seconds
  alternative?: string
  originalError?: Error
}

// 에러 분류 함수
export function classifyError(error: Error): AIError {
  const errorMessage = error.message.toLowerCase()
  
  // API 에러
  if (errorMessage.includes('api') || errorMessage.includes('gemini') || errorMessage.includes('google')) {
    return {
      type: 'API_ERROR',
      severity: 'HIGH',
      message: error.message,
      userMessage: 'AI 서비스에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.',
      canRetry: true,
      retryAfter: 30,
      alternative: '수동으로 요약이나 태그를 작성해보세요.',
      originalError: error
    }
  }
  
  // 네트워크 에러
  if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('timeout')) {
    return {
      type: 'NETWORK_ERROR',
      severity: 'MEDIUM',
      message: error.message,
      userMessage: '인터넷 연결을 확인해주세요. 네트워크가 불안정할 수 있습니다.',
      canRetry: true,
      retryAfter: 10,
      alternative: '네트워크가 안정된 후 다시 시도해주세요.',
      originalError: error
    }
  }
  
  // 인증 에러
  if (errorMessage.includes('auth') || errorMessage.includes('unauthorized') || errorMessage.includes('forbidden')) {
    return {
      type: 'AUTH_ERROR',
      severity: 'CRITICAL',
      message: error.message,
      userMessage: '인증에 문제가 있습니다. 다시 로그인해주세요.',
      canRetry: false,
      alternative: '로그아웃 후 다시 로그인해주세요.',
      originalError: error
    }
  }
  
  // 속도 제한 에러
  if (errorMessage.includes('rate limit') || errorMessage.includes('quota') || errorMessage.includes('limit')) {
    return {
      type: 'RATE_LIMIT_ERROR',
      severity: 'MEDIUM',
      message: error.message,
      userMessage: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
      canRetry: true,
      retryAfter: 60,
      alternative: '잠시 후 다시 시도하거나 수동으로 작성해보세요.',
      originalError: error
    }
  }
  
  // 검증 에러
  if (errorMessage.includes('validation') || errorMessage.includes('invalid') || errorMessage.includes('format')) {
    return {
      type: 'VALIDATION_ERROR',
      severity: 'LOW',
      message: error.message,
      userMessage: '입력 데이터에 문제가 있습니다. 내용을 확인해주세요.',
      canRetry: false,
      alternative: '노트 내용을 확인하고 다시 시도해주세요.',
      originalError: error
    }
  }
  
  // 토큰 제한 에러
  if (errorMessage.includes('token') || errorMessage.includes('length') || errorMessage.includes('too long')) {
    return {
      type: 'VALIDATION_ERROR',
      severity: 'MEDIUM',
      message: error.message,
      userMessage: '노트 내용이 너무 깁니다. 내용을 줄여주세요.',
      canRetry: false,
      alternative: '노트를 여러 개로 나누어 작성해보세요.',
      originalError: error
    }
  }
  
  // 알 수 없는 에러
  return {
    type: 'UNKNOWN_ERROR',
    severity: 'HIGH',
    message: error.message,
    userMessage: '예상치 못한 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
    canRetry: true,
    retryAfter: 30,
    alternative: '문제가 지속되면 관리자에게 문의해주세요.',
    originalError: error
  }
}

// 에러 심각도별 색상 반환
export function getErrorColor(severity: ErrorSeverity): string {
  switch (severity) {
    case 'LOW':
      return 'text-blue-600 bg-blue-50 border-blue-200'
    case 'MEDIUM':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    case 'HIGH':
      return 'text-orange-600 bg-orange-50 border-orange-200'
    case 'CRITICAL':
      return 'text-red-600 bg-red-50 border-red-200'
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200'
  }
}

// 에러 심각도별 아이콘 반환
export function getErrorIcon(severity: ErrorSeverity): string {
  switch (severity) {
    case 'LOW':
      return 'info'
    case 'MEDIUM':
      return 'warning'
    case 'HIGH':
      return 'alert-triangle'
    case 'CRITICAL':
      return 'x-circle'
    default:
      return 'help-circle'
  }
}

// 에러 복구 가능 여부 확인
export function isRecoverableError(error: AIError): boolean {
  return error.canRetry && error.severity !== 'CRITICAL'
}

// 에러 재시도 지연 시간 계산 (지수 백오프)
export function calculateRetryDelay(attempt: number, baseDelay: number = 1000): number {
  return Math.min(baseDelay * Math.pow(2, attempt), 30000) // 최대 30초
}

// 에러 메시지 정규화
export function normalizeErrorMessage(error: Error): string {
  // 민감한 정보 제거
  let message = error.message
  
  // API 키나 토큰 정보 제거
  message = message.replace(/[A-Za-z0-9]{20,}/g, '[REDACTED]')
  
  // URL 정보 제거
  message = message.replace(/https?:\/\/[^\s]+/g, '[URL]')
  
  // IP 주소 제거
  message = message.replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '[IP]')
  
  return message
}
