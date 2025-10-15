// lib/ai/__tests__/retry-handler.test.ts
// 재시도 로직 테스트
// 지수 백오프, 재시도 횟수 제한, 재시도 조건 분류 테스트
// 관련 파일: lib/ai/retry-handler.ts

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals'
import { 
  isRetryableError, 
  getRetryDelay, 
  executeWithRetry, 
  RetryState, 
  shouldRetry 
} from '../retry-handler'
import { AIError } from '../error-handler'

// Mock dependencies
jest.mock('@/lib/db/connection', () => ({
  db: {
    insert: jest.fn(),
    select: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  }
}))

describe('재시도 로직', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('isRetryableError', () => {
    it('재시도 가능한 에러를 올바르게 판단해야 함', () => {
      const retryableError = {
        type: 'API_ERROR' as const,
        severity: 'MEDIUM' as const,
        canRetry: true,
        message: 'test',
        userMessage: 'test'
      }
      
      const nonRetryableError = {
        type: 'VALIDATION_ERROR' as const,
        severity: 'LOW' as const,
        canRetry: false,
        message: 'test',
        userMessage: 'test'
      }
      
      expect(isRetryableError(retryableError)).toBe(true)
      expect(isRetryableError(nonRetryableError)).toBe(false)
    })
  })

  describe('getRetryDelay', () => {
    it('기본 지연 시간을 올바르게 계산해야 함', () => {
      expect(getRetryDelay(0)).toBe(1000)
      expect(getRetryDelay(1)).toBe(2000)
      expect(getRetryDelay(2)).toBe(4000)
    })

    it('최대 지연 시간을 초과하지 않아야 함', () => {
      const result = getRetryDelay(10)
      expect(result).toBeLessThanOrEqual(30000)
    })
  })

  describe('executeWithRetry', () => {
    it('성공적인 작업을 올바르게 처리해야 함', async () => {
      const mockOperation = jest.fn().mockResolvedValue('success')
      
      const result = await executeWithRetry(mockOperation)
      
      expect(result.success).toBe(true)
      expect(result.data).toBe('success')
      expect(result.attempts).toBe(1)
      expect(mockOperation).toHaveBeenCalledTimes(1)
    })

    it('재시도 가능한 에러에 대해 재시도해야 함', async () => {
      const mockOperation = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success')
      
      const result = await executeWithRetry(mockOperation, {
        maxAttempts: 3,
        baseDelay: 10,
        maxDelay: 100,
        retryableErrors: ['NETWORK_ERROR']
      })
      
      expect(result.success).toBe(true)
      expect(result.data).toBe('success')
      expect(result.attempts).toBe(3)
      expect(mockOperation).toHaveBeenCalledTimes(3)
    })

    it('최대 시도 횟수 초과 시 실패해야 함', async () => {
      const mockOperation = jest.fn().mockRejectedValue(new Error('Persistent error'))
      
      const result = await executeWithRetry(mockOperation, {
        maxAttempts: 2,
        baseDelay: 10,
        maxDelay: 100,
        retryableErrors: ['API_ERROR']
      })
      
      expect(result.success).toBe(false)
      expect(result.attempts).toBe(2)
      expect(mockOperation).toHaveBeenCalledTimes(2)
    })

    it('재시도 불가능한 에러에 대해 즉시 실패해야 함', async () => {
      const mockOperation = jest.fn().mockRejectedValue(new Error('Validation error'))
      
      const result = await executeWithRetry(mockOperation, {
        maxAttempts: 3,
        baseDelay: 10,
        maxDelay: 100,
        retryableErrors: ['API_ERROR']
      })
      
      expect(result.success).toBe(false)
      expect(result.attempts).toBe(1)
      expect(mockOperation).toHaveBeenCalledTimes(1)
    })
  })

  describe('RetryState', () => {
    let retryState: RetryState

    beforeEach(() => {
      retryState = new RetryState()
    })

    it('초기 상태가 올바르게 설정되어야 함', () => {
      expect(retryState.currentAttempts).toBe(0)
      expect(retryState.isCurrentlyRetrying).toBe(false)
      expect(retryState.hasError).toBe(false)
      expect(retryState.lastErrorInfo).toBeNull()
    })

    it('재시도 시작 시 상태가 올바르게 업데이트되어야 함', () => {
      retryState.startRetry()
      
      expect(retryState.currentAttempts).toBe(1)
      expect(retryState.isCurrentlyRetrying).toBe(true)
    })

    it('재시도 중지 시 상태가 올바르게 업데이트되어야 함', () => {
      retryState.startRetry()
      retryState.stopRetry()
      
      expect(retryState.isCurrentlyRetrying).toBe(false)
    })

    it('에러 설정 시 상태가 올바르게 업데이트되어야 함', () => {
      const error = {
        type: 'API_ERROR' as const,
        severity: 'MEDIUM' as const,
        canRetry: true,
        message: 'test',
        userMessage: 'test'
      }
      
      retryState.setError(error)
      
      expect(retryState.hasError).toBe(true)
      expect(retryState.lastErrorInfo).toBe(error)
    })

    it('리셋 시 상태가 초기화되어야 함', () => {
      retryState.startRetry()
      retryState.setError({
        type: 'API_ERROR' as const,
        severity: 'MEDIUM' as const,
        canRetry: true,
        message: 'test',
        userMessage: 'test'
      })
      
      retryState.reset()
      
      expect(retryState.currentAttempts).toBe(0)
      expect(retryState.isCurrentlyRetrying).toBe(false)
      expect(retryState.hasError).toBe(false)
      expect(retryState.lastErrorInfo).toBeNull()
    })

    it('재시도 진행률을 올바르게 계산해야 함', () => {
      retryState.startRetry()
      retryState.startRetry()
      
      const progress = retryState.getRetryProgress()
      expect(progress).toBeGreaterThan(0)
      expect(progress).toBeLessThanOrEqual(100)
    })
  })

  describe('shouldRetry', () => {
    const mockError = {
      type: 'API_ERROR' as const,
      severity: 'MEDIUM' as const,
      canRetry: true,
      message: 'test',
      userMessage: 'test'
    }

    it('최대 시도 횟수 초과 시 재시도하지 않아야 함', () => {
      expect(shouldRetry(mockError, 3, 3)).toBe(false)
    })

    it('재시도 불가능한 에러에 대해 재시도하지 않아야 함', () => {
      const nonRetryableError = { ...mockError, canRetry: false }
      expect(shouldRetry(nonRetryableError, 1, 3)).toBe(false)
    })

    it('CRITICAL 심각도 에러에 대해 재시도하지 않아야 함', () => {
      const criticalError = { ...mockError, severity: 'CRITICAL' as const }
      expect(shouldRetry(criticalError, 1, 3)).toBe(false)
    })

    it('RATE_LIMIT_ERROR는 제한적으로 재시도해야 함', () => {
      const rateLimitError = { ...mockError, type: 'RATE_LIMIT_ERROR' as const }
      expect(shouldRetry(rateLimitError, 1, 3)).toBe(true)
      expect(shouldRetry(rateLimitError, 2, 3)).toBe(false)
    })

    it('NETWORK_ERROR는 많이 재시도해야 함', () => {
      const networkError = { ...mockError, type: 'NETWORK_ERROR' as const }
      expect(shouldRetry(networkError, 4, 3)).toBe(true)
      expect(shouldRetry(networkError, 5, 3)).toBe(false)
    })

    it('API_ERROR는 적당히 재시도해야 함', () => {
      expect(shouldRetry(mockError, 2, 3)).toBe(true)
      expect(shouldRetry(mockError, 3, 3)).toBe(false)
    })
  })
})
