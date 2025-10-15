// lib/ai/__tests__/error-handler.test.ts
// 에러 처리 로직 테스트
// 에러 분류, 사용자 친화적 메시지 변환, 에러 심각도 분류 테스트
// 관련 파일: lib/ai/error-handler.ts

import { describe, it, expect } from '@jest/globals'
import { 
  classifyError, 
  getErrorColor, 
  getErrorIcon, 
  isRecoverableError,
  calculateRetryDelay,
  normalizeErrorMessage
} from '../error-handler'

describe('에러 처리 로직', () => {
  describe('classifyError', () => {
    it('API 에러를 올바르게 분류해야 함', () => {
      const error = new Error('Gemini API connection failed')
      const result = classifyError(error)
      
      expect(result.type).toBe('API_ERROR')
      expect(result.severity).toBe('HIGH')
      expect(result.canRetry).toBe(true)
      expect(result.userMessage).toContain('AI 서비스에 연결할 수 없습니다')
      expect(result.retryAfter).toBe(30)
    })

    it('네트워크 에러를 올바르게 분류해야 함', () => {
      const error = new Error('Network timeout occurred')
      const result = classifyError(error)
      
      expect(result.type).toBe('NETWORK_ERROR')
      expect(result.severity).toBe('MEDIUM')
      expect(result.canRetry).toBe(true)
      expect(result.userMessage).toContain('인터넷 연결을 확인해주세요')
      expect(result.retryAfter).toBe(10)
    })

    it('인증 에러를 올바르게 분류해야 함', () => {
      const error = new Error('Unauthorized access')
      const result = classifyError(error)
      
      expect(result.type).toBe('AUTH_ERROR')
      expect(result.severity).toBe('CRITICAL')
      expect(result.canRetry).toBe(false)
      expect(result.userMessage).toContain('인증에 문제가 있습니다')
    })

    it('속도 제한 에러를 올바르게 분류해야 함', () => {
      const error = new Error('Rate limit exceeded')
      const result = classifyError(error)
      
      expect(result.type).toBe('RATE_LIMIT_ERROR')
      expect(result.severity).toBe('MEDIUM')
      expect(result.canRetry).toBe(true)
      expect(result.userMessage).toContain('요청이 너무 많습니다')
      expect(result.retryAfter).toBe(60)
    })

    it('검증 에러를 올바르게 분류해야 함', () => {
      const error = new Error('Invalid input format')
      const result = classifyError(error)
      
      expect(result.type).toBe('VALIDATION_ERROR')
      expect(result.severity).toBe('LOW')
      expect(result.canRetry).toBe(false)
      expect(result.userMessage).toContain('입력 데이터에 문제가 있습니다')
    })

    it('토큰 제한 에러를 올바르게 분류해야 함', () => {
      const error = new Error('Token limit exceeded')
      const result = classifyError(error)
      
      expect(result.type).toBe('VALIDATION_ERROR')
      expect(result.severity).toBe('MEDIUM')
      expect(result.canRetry).toBe(false)
      expect(result.userMessage).toContain('노트 내용이 너무 깁니다')
    })

    it('알 수 없는 에러를 올바르게 분류해야 함', () => {
      const error = new Error('Unknown error occurred')
      const result = classifyError(error)
      
      expect(result.type).toBe('UNKNOWN_ERROR')
      expect(result.severity).toBe('HIGH')
      expect(result.canRetry).toBe(true)
      expect(result.userMessage).toContain('예상치 못한 오류가 발생했습니다')
    })
  })

  describe('getErrorColor', () => {
    it('심각도별 색상을 올바르게 반환해야 함', () => {
      expect(getErrorColor('LOW')).toContain('blue')
      expect(getErrorColor('MEDIUM')).toContain('yellow')
      expect(getErrorColor('HIGH')).toContain('orange')
      expect(getErrorColor('CRITICAL')).toContain('red')
    })
  })

  describe('getErrorIcon', () => {
    it('심각도별 아이콘을 올바르게 반환해야 함', () => {
      expect(getErrorIcon('LOW')).toBe('info')
      expect(getErrorIcon('MEDIUM')).toBe('warning')
      expect(getErrorIcon('HIGH')).toBe('alert-triangle')
      expect(getErrorIcon('CRITICAL')).toBe('x-circle')
    })
  })

  describe('isRecoverableError', () => {
    it('재시도 가능한 에러를 올바르게 판단해야 함', () => {
      const recoverableError = {
        type: 'API_ERROR' as const,
        severity: 'MEDIUM' as const,
        canRetry: true,
        message: 'test',
        userMessage: 'test'
      }
      
      const nonRecoverableError = {
        type: 'AUTH_ERROR' as const,
        severity: 'CRITICAL' as const,
        canRetry: false,
        message: 'test',
        userMessage: 'test'
      }
      
      expect(isRecoverableError(recoverableError)).toBe(true)
      expect(isRecoverableError(nonRecoverableError)).toBe(false)
    })
  })

  describe('calculateRetryDelay', () => {
    it('지수 백오프를 올바르게 계산해야 함', () => {
      expect(calculateRetryDelay(0, 1000)).toBe(1000)
      expect(calculateRetryDelay(1, 1000)).toBe(2000)
      expect(calculateRetryDelay(2, 1000)).toBe(4000)
      expect(calculateRetryDelay(3, 1000)).toBe(8000)
    })

    it('최대 지연 시간을 초과하지 않아야 함', () => {
      const result = calculateRetryDelay(10, 1000)
      expect(result).toBeLessThanOrEqual(30000)
    })
  })

  describe('normalizeErrorMessage', () => {
    it('민감한 정보를 제거해야 함', () => {
      const error = new Error('API key abc123def456ghi789 is invalid')
      const normalized = normalizeErrorMessage(error)
      
      expect(normalized).not.toContain('abc123def456ghi789')
      expect(normalized).toContain('[REDACTED]')
    })

    it('URL 정보를 제거해야 함', () => {
      const error = new Error('Failed to connect to https://api.example.com')
      const normalized = normalizeErrorMessage(error)
      
      expect(normalized).not.toContain('https://api.example.com')
      expect(normalized).toContain('[URL]')
    })

    it('IP 주소를 제거해야 함', () => {
      const error = new Error('Connection failed to 192.168.1.1')
      const normalized = normalizeErrorMessage(error)
      
      expect(normalized).not.toContain('192.168.1.1')
      expect(normalized).toContain('[IP]')
    })
  })
})
