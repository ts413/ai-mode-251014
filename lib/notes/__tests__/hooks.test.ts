// lib/notes/__tests__/hooks.test.ts
// 노트 관련 훅 테스트
// AI 상태 관리 훅과 AI 처리 함수 래퍼 테스트
// 관련 파일: lib/notes/hooks.ts

import { renderHook, act } from '@testing-library/react'
import { useAIStatus, useAIProcessor } from '../hooks'

describe('useAIStatus 훅', () => {
  it('초기 상태가 IDLE이어야 함', () => {
    const { result } = renderHook(() => useAIStatus())
    
    expect(result.current.status).toBe('IDLE')
    expect(result.current.error).toBeNull()
    expect(result.current.isIdle).toBe(true)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isCompleted).toBe(false)
    expect(result.current.isError).toBe(false)
  })

  it('setLoading이 올바르게 작동해야 함', () => {
    const { result } = renderHook(() => useAIStatus())
    
    act(() => {
      result.current.setLoading()
    })
    
    expect(result.current.status).toBe('LOADING')
    expect(result.current.isLoading).toBe(true)
    expect(result.current.error).toBeNull()
  })

  it('setCompleted가 올바르게 작동해야 함', () => {
    const { result } = renderHook(() => useAIStatus())
    
    act(() => {
      result.current.setCompleted()
    })
    
    expect(result.current.status).toBe('COMPLETED')
    expect(result.current.isCompleted).toBe(true)
    expect(result.current.error).toBeNull()
  })

  it('setError가 올바르게 작동해야 함', () => {
    const { result } = renderHook(() => useAIStatus())
    const errorMessage = '테스트 에러'
    
    act(() => {
      result.current.setError(errorMessage)
    })
    
    expect(result.current.status).toBe('ERROR')
    expect(result.current.isError).toBe(true)
    expect(result.current.error).toBe(errorMessage)
  })

  it('reset이 올바르게 작동해야 함', () => {
    const { result } = renderHook(() => useAIStatus())
    
    // 먼저 에러 상태로 설정
    act(() => {
      result.current.setError('테스트 에러')
    })
    
    expect(result.current.status).toBe('ERROR')
    
    // 리셋
    act(() => {
      result.current.reset()
    })
    
    expect(result.current.status).toBe('IDLE')
    expect(result.current.error).toBeNull()
    expect(result.current.isIdle).toBe(true)
  })
})

describe('useAIProcessor 훅', () => {
  it('성공적인 처리 시 올바르게 작동해야 함', async () => {
    const mockProcessor = jest.fn().mockResolvedValue('성공')
    const { result } = renderHook(() => useAIProcessor(mockProcessor))
    
    let processResult: string | null = null
    
    await act(async () => {
      processResult = await result.current.process('test')
    })
    
    expect(processResult).toBe('성공')
    expect(result.current.status).toBe('COMPLETED')
    expect(result.current.isCompleted).toBe(true)
    expect(mockProcessor).toHaveBeenCalledWith('test')
  })

  it('실패한 처리 시 올바르게 작동해야 함', async () => {
    const mockError = new Error('처리 실패')
    const mockProcessor = jest.fn().mockRejectedValue(mockError)
    const { result } = renderHook(() => useAIProcessor(mockProcessor))
    
    let processResult: string | null = null
    
    await act(async () => {
      processResult = await result.current.process('test')
    })
    
    expect(processResult).toBeNull()
    expect(result.current.status).toBe('ERROR')
    expect(result.current.isError).toBe(true)
    expect(result.current.error).toBe('처리 실패')
  })

  it('알 수 없는 에러 시 기본 메시지를 표시해야 함', async () => {
    const mockProcessor = jest.fn().mockRejectedValue('알 수 없는 에러')
    const { result } = renderHook(() => useAIProcessor(mockProcessor))
    
    await act(async () => {
      await result.current.process('test')
    })
    
    expect(result.current.status).toBe('ERROR')
    expect(result.current.error).toBe('알 수 없는 오류가 발생했습니다')
  })
})
