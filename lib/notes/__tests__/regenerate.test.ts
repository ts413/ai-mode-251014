// lib/notes/__tests__/regenerate.test.ts
// 재생성 기능 테스트
// 재생성 서버 액션, 횟수 제한 로직 테스트
// 관련 파일: lib/notes/actions.ts, lib/notes/queries.ts

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals'
import { regenerateAI, regenerateSummary, regenerateTags } from '../actions'
import { getUserRegenerationCount } from '../queries'

// Mock dependencies
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn()
}))

jest.mock('@/lib/db/connection', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    delete: jest.fn()
  }
}))

jest.mock('@/lib/ai/gemini', () => ({
  generateContent: jest.fn(),
  createSummaryPrompt: jest.fn(),
  createTagPrompt: jest.fn()
}))

describe('재생성 서버 액션', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('regenerateAI', () => {
    it('성공적으로 전체 재생성해야 함', async () => {
      // Mock setup
      const mockUser = { id: 'user-123' }
      const mockNote = { id: 'note-123', userId: 'user-123', content: '테스트 내용' }
      const mockSummary = '테스트 요약'
      const mockTags = ['태그1', '태그2']

      // Mock implementations
      const mockCreateClient = import('@/lib/supabase/server').createClient
      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null
          })
        }
      })

      const mockDb = import('@/lib/db/connection').db
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockNote])
          })
        })
      })

      mockDb.delete.mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined)
      })

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockResolvedValue(undefined)
      })

      const mockGenerateContent = import('@/lib/ai/gemini').generateContent
      mockGenerateContent
        .mockResolvedValueOnce(mockSummary)
        .mockResolvedValueOnce(mockTags.join(', '))

      // Test
      const result = await regenerateAI('note-123')

      // Assertions
      expect(result.success).toBe(true)
      expect(result.summary).toBe(mockSummary)
      expect(result.tags).toEqual(mockTags)
    })

    it('재생성 횟수 제한 시 에러를 반환해야 함', async () => {
      // Mock setup
      const mockUser = { id: 'user-123' }
      const mockCreateClient = import('@/lib/supabase/server').createClient
      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null
          })
        }
      })

      // Mock limit check to return limit exceeded
      const mockDb = import('@/lib/db/connection').db
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ count: 10 }])
          })
        })
      })

      // Test
      const result = await regenerateAI('note-123')

      // Assertions
      expect(result.success).toBe(false)
      expect(result.error).toContain('일일 재생성 횟수 제한에 도달했습니다')
    })

    it('인증 실패 시 에러를 반환해야 함', async () => {
      // Mock setup
      const mockCreateClient = import('@/lib/supabase/server').createClient
      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: new Error('인증 실패')
          })
        }
      })

      // Test
      const result = await regenerateAI('note-123')

      // Assertions
      expect(result.success).toBe(false)
      expect(result.error).toBe('인증이 필요합니다')
    })
  })

  describe('regenerateSummary', () => {
    it('성공적으로 요약만 재생성해야 함', async () => {
      // Mock setup
      const mockUser = { id: 'user-123' }
      const mockNote = { id: 'note-123', userId: 'user-123', content: '테스트 내용' }
      const mockSummary = '테스트 요약'

      const mockCreateClient = import('@/lib/supabase/server').createClient
      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null
          })
        }
      })

      const mockDb = import('@/lib/db/connection').db
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockNote])
          })
        })
      })

      mockDb.delete.mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined)
      })

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockResolvedValue(undefined)
      })

      const mockGenerateContent = import('@/lib/ai/gemini').generateContent
      mockGenerateContent.mockResolvedValue(mockSummary)

      // Test
      const result = await regenerateSummary('note-123')

      // Assertions
      expect(result.success).toBe(true)
      expect(result.summary).toBe(mockSummary)
      expect(result.tags).toBeUndefined()
    })
  })

  describe('regenerateTags', () => {
    it('성공적으로 태그만 재생성해야 함', async () => {
      // Mock setup
      const mockUser = { id: 'user-123' }
      const mockNote = { id: 'note-123', userId: 'user-123', content: '테스트 내용' }
      const mockTags = ['태그1', '태그2']

      const mockCreateClient = import('@/lib/supabase/server').createClient
      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null
          })
        }
      })

      const mockDb = import('@/lib/db/connection').db
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockNote])
          })
        })
      })

      mockDb.delete.mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined)
      })

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockResolvedValue(undefined)
      })

      const mockGenerateContent = import('@/lib/ai/gemini').generateContent
      mockGenerateContent.mockResolvedValue(mockTags.join(', '))

      // Test
      const result = await regenerateTags('note-123')

      // Assertions
      expect(result.success).toBe(true)
      expect(result.tags).toEqual(mockTags)
      expect(result.summary).toBeUndefined()
    })
  })
})

describe('재생성 횟수 제한', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getUserRegenerationCount', () => {
    it('사용자별 재생성 횟수를 올바르게 조회해야 함', async () => {
      // Mock setup
      const mockUser = { id: 'user-123' }
      const mockCreateClient = import('@/lib/supabase/server').createClient
      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null
          })
        }
      })

      const mockDb = import('@/lib/db/connection').db
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ count: 5 }])
          })
        })
      })

      // Test
      const result = await getUserRegenerationCount()

      // Assertions
      expect(result.currentCount).toBe(5)
      expect(result.limit).toBe(10)
      expect(result.canRegenerate).toBe(true)
    })

    it('재생성 횟수 제한에 도달했을 때 올바르게 처리해야 함', async () => {
      // Mock setup
      const mockUser = { id: 'user-123' }
      const mockCreateClient = import('@/lib/supabase/server').createClient
      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null
          })
        }
      })

      const mockDb = import('@/lib/db/connection').db
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ count: 10 }])
          })
        })
      })

      // Test
      const result = await getUserRegenerationCount()

      // Assertions
      expect(result.currentCount).toBe(10)
      expect(result.limit).toBe(10)
      expect(result.canRegenerate).toBe(false)
    })

    it('인증 실패 시 기본값을 반환해야 함', async () => {
      // Mock setup
      const mockCreateClient = import('@/lib/supabase/server').createClient
      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: new Error('인증 실패')
          })
        }
      })

      // Test
      const result = await getUserRegenerationCount()

      // Assertions
      expect(result.currentCount).toBe(0)
      expect(result.limit).toBe(10)
      expect(result.canRegenerate).toBe(false)
    })
  })
})
