// lib/notes/__tests__/edit.test.ts
// 편집 기능 테스트
// 편집 서버 액션, 유효성 검증 테스트
// 관련 파일: lib/notes/actions.ts

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals'
import { updateSummary, updateTags } from '../actions'

// Mock dependencies
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn()
}))

jest.mock('@/lib/db/connection', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  }
}))

describe('편집 서버 액션', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('updateSummary', () => {
    it('성공적으로 요약을 편집해야 함', async () => {
      // Mock setup
      const mockUser = { id: 'user-123' }
      const mockNote = { id: 'note-123', userId: 'user-123' }
      const mockSummary = { id: 'summary-123', content: '기존 요약' }
      const newContent = '새로운 요약'

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

      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([mockSummary])
            })
          })
        })
      })

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockResolvedValue(undefined)
      })

      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(undefined)
        })
      })

      // Test
      const result = await updateSummary('note-123', newContent)

      // Assertions
      expect(result.success).toBe(true)
      expect(result.summary).toBe(newContent)
    })

    it('요약 유효성 검증이 올바르게 작동해야 함', async () => {
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
            limit: jest.fn().mockResolvedValue([{ id: 'note-123', userId: 'user-123' }])
          })
        })
      })

      // Test - 빈 내용
      const result1 = await updateSummary('note-123', '')
      expect(result1.success).toBe(false)
      expect(result1.error).toBe('요약 내용을 입력해주세요')

      // Test - 너무 긴 내용
      const longContent = 'a'.repeat(1001)
      const result2 = await updateSummary('note-123', longContent)
      expect(result2.success).toBe(false)
      expect(result2.error).toBe('요약은 1000자 이내로 입력해주세요')
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
      const result = await updateSummary('note-123', '새 요약')

      // Assertions
      expect(result.success).toBe(false)
      expect(result.error).toBe('인증이 필요합니다')
    })
  })

  describe('updateTags', () => {
    it('성공적으로 태그를 편집해야 함', async () => {
      // Mock setup
      const mockUser = { id: 'user-123' }
      const mockNote = { id: 'note-123', userId: 'user-123' }
      const newTags = ['태그1', '태그2', '태그3']

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

      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([])
        })
      })

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockResolvedValue(undefined)
      })

      mockDb.delete.mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined)
      })

      // Test
      const result = await updateTags('note-123', newTags)

      // Assertions
      expect(result.success).toBe(true)
      expect(result.tags).toEqual(newTags)
    })

    it('태그 유효성 검증이 올바르게 작동해야 함', async () => {
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
            limit: jest.fn().mockResolvedValue([{ id: 'note-123', userId: 'user-123' }])
          })
        })
      })

      // Test - 배열이 아닌 경우
      const result1 = await updateTags('note-123', '태그' as any)
      expect(result1.success).toBe(false)
      expect(result1.error).toBe('태그는 배열 형태여야 합니다')

      // Test - 너무 많은 태그
      const manyTags = Array.from({ length: 11 }, (_, i) => `태그${i}`)
      const result2 = await updateTags('note-123', manyTags)
      expect(result2.success).toBe(false)
      expect(result2.error).toBe('태그는 최대 10개까지 입력할 수 있습니다')

      // Test - 빈 태그 배열
      const result3 = await updateTags('note-123', [])
      expect(result3.success).toBe(false)
      expect(result3.error).toBe('유효한 태그를 입력해주세요')
    })

    it('태그 정규화가 올바르게 작동해야 함', async () => {
      // Mock setup
      const mockUser = { id: 'user-123' }
      const mockNote = { id: 'note-123', userId: 'user-123' }
      const inputTags = ['  태그1  ', 'TAG2', '태그3']

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

      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([])
        })
      })

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockResolvedValue(undefined)
      })

      mockDb.delete.mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined)
      })

      // Test
      const result = await updateTags('note-123', inputTags)

      // Assertions
      expect(result.success).toBe(true)
      expect(result.tags).toEqual(['태그1', 'tag2', '태그3'])
    })
  })
})
