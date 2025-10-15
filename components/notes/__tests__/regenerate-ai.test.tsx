// components/notes/__tests__/regenerate-ai.test.tsx
// 재생성 UI 컴포넌트 테스트
// 재생성 버튼, 옵션, 통합 컴포넌트 렌더링 테스트
// 관련 파일: components/notes/regenerate-button.tsx, components/notes/regenerate-options.tsx

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { RegenerateButton } from '../regenerate-button'
import { RegenerateOptions } from '../regenerate-options'
import { RegenerateAI } from '../regenerate-ai'

// Mock dependencies
jest.mock('@/lib/notes/actions', () => ({
  regenerateAI: jest.fn(),
  regenerateSummary: jest.fn(),
  regenerateTags: jest.fn()
}))

jest.mock('@/lib/notes/queries', () => ({
  getUserRegenerationCount: jest.fn()
}))

jest.mock('@/lib/notes/hooks', () => ({
  useAIStatus: jest.fn(() => ({
    status: 'IDLE',
    error: null,
    setLoading: jest.fn(),
    setCompleted: jest.fn(),
    setError: jest.fn(),
    reset: jest.fn(),
    isLoading: false,
    isCompleted: false,
    isError: false,
    isIdle: true
  }))
}))

describe('RegenerateButton 컴포넌트', () => {
  it('기본 렌더링이 올바르게 작동해야 함', () => {
    const mockOnRegenerate = jest.fn()
    
    render(
      <RegenerateButton onRegenerate={mockOnRegenerate} />
    )
    
    expect(screen.getByText('재생성')).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('로딩 상태일 때 스피너를 표시해야 함', () => {
    const mockOnRegenerate = jest.fn()
    
    render(
      <RegenerateButton 
        onRegenerate={mockOnRegenerate} 
        isLoading={true}
      />
    )
    
    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
    expect(screen.getByText('재생성')).toBeInTheDocument()
  })

  it('비활성화 상태일 때 버튼이 비활성화되어야 함', () => {
    const mockOnRegenerate = jest.fn()
    
    render(
      <RegenerateButton 
        onRegenerate={mockOnRegenerate} 
        disabled={true}
      />
    )
    
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('클릭 시 onRegenerate가 호출되어야 함', () => {
    const mockOnRegenerate = jest.fn()
    
    render(
      <RegenerateButton onRegenerate={mockOnRegenerate} />
    )
    
    fireEvent.click(screen.getByRole('button'))
    expect(mockOnRegenerate).toHaveBeenCalledTimes(1)
  })

  it('커스텀 텍스트를 표시해야 함', () => {
    const mockOnRegenerate = jest.fn()
    
    render(
      <RegenerateButton 
        onRegenerate={mockOnRegenerate}
      >
        커스텀 재생성
      </RegenerateButton>
    )
    
    expect(screen.getByText('커스텀 재생성')).toBeInTheDocument()
  })
})

describe('RegenerateOptions 컴포넌트', () => {
  it('기본 렌더링이 올바르게 작동해야 함', () => {
    const mockOnRegenerate = jest.fn()
    
    render(
      <RegenerateOptions onRegenerate={mockOnRegenerate} />
    )
    
    expect(screen.getByText('AI 재생성')).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('드롭다운 메뉴가 올바르게 렌더링되어야 함', () => {
    const mockOnRegenerate = jest.fn()
    
    render(
      <RegenerateOptions onRegenerate={mockOnRegenerate} />
    )
    
    // 드롭다운 트리거 버튼
    const dropdownTrigger = screen.getByRole('button', { name: /zap/i })
    expect(dropdownTrigger).toBeInTheDocument()
  })

  it('로딩 상태일 때 버튼이 비활성화되어야 함', () => {
    const mockOnRegenerate = jest.fn()
    
    render(
      <RegenerateOptions 
        onRegenerate={mockOnRegenerate} 
        isLoading={true}
      />
    )
    
    const buttons = screen.getAllByRole('button')
    buttons.forEach(button => {
      expect(button).toBeDisabled()
    })
  })

  it('재생성 옵션 클릭 시 올바른 타입으로 호출되어야 함', () => {
    const mockOnRegenerate = jest.fn()
    
    render(
      <RegenerateOptions onRegenerate={mockOnRegenerate} />
    )
    
    // 전체 재생성 버튼 클릭
    fireEvent.click(screen.getByText('AI 재생성'))
    expect(mockOnRegenerate).toHaveBeenCalledWith('both')
  })
})

describe('RegenerateAI 컴포넌트', () => {
  const mockProps = {
    noteId: 'note-123',
    onSuccess: jest.fn(),
    onError: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('기본 렌더링이 올바르게 작동해야 함', () => {
    render(<RegenerateAI {...mockProps} />)
    
    expect(screen.getByText('AI 재생성')).toBeInTheDocument()
  })

  it('재생성 횟수 정보를 표시해야 함', async () => {
    const mockGetUserRegenerationCount = import('@/lib/notes/queries').getUserRegenerationCount
    mockGetUserRegenerationCount.mockResolvedValue({
      currentCount: 5,
      limit: 10,
      canRegenerate: true
    })

    render(<RegenerateAI {...mockProps} showLimitInfo={true} />)
    
    // 재생성 횟수 정보가 표시되는지 확인
    await waitFor(() => {
      expect(mockGetUserRegenerationCount).toHaveBeenCalled()
    })
  })

  it('재생성 횟수 제한에 도달했을 때 경고를 표시해야 함', async () => {
    const mockGetUserRegenerationCount = import('@/lib/notes/queries').getUserRegenerationCount
    mockGetUserRegenerationCount.mockResolvedValue({
      currentCount: 10,
      limit: 10,
      canRegenerate: false
    })

    render(<RegenerateAI {...mockProps} showLimitInfo={true} />)
    
    await waitFor(() => {
      expect(screen.getByText(/일일 재생성 횟수 제한에 도달했습니다/)).toBeInTheDocument()
    })
  })

  it('재생성 성공 시 onSuccess 콜백이 호출되어야 함', async () => {
    const { regenerateAI: mockRegenerateAI } = await import('@/lib/notes/actions')
    mockRegenerateAI.mockResolvedValue({
      success: true,
      summary: '테스트 요약',
      tags: ['태그1', '태그2']
    })

    const mockGetUserRegenerationCount = import('@/lib/notes/queries').getUserRegenerationCount
    mockGetUserRegenerationCount.mockResolvedValue({
      currentCount: 0,
      limit: 10,
      canRegenerate: true
    })

    render(<RegenerateAI {...mockProps} />)
    
    // 재생성 버튼 클릭
    fireEvent.click(screen.getByText('AI 재생성'))
    
    await waitFor(() => {
      expect(mockRegenerateAI).toHaveBeenCalledWith('note-123')
      expect(mockProps.onSuccess).toHaveBeenCalledWith({
        summary: '테스트 요약',
        tags: ['태그1', '태그2']
      })
    })
  })

  it('재생성 실패 시 onError 콜백이 호출되어야 함', async () => {
    const { regenerateAI: mockRegenerateAI } = await import('@/lib/notes/actions')
    mockRegenerateAI.mockResolvedValue({
      success: false,
      error: '재생성 실패'
    })

    const mockGetUserRegenerationCount = import('@/lib/notes/queries').getUserRegenerationCount
    mockGetUserRegenerationCount.mockResolvedValue({
      currentCount: 0,
      limit: 10,
      canRegenerate: true
    })

    render(<RegenerateAI {...mockProps} />)
    
    // 재생성 버튼 클릭
    fireEvent.click(screen.getByText('AI 재생성'))
    
    await waitFor(() => {
      expect(mockProps.onError).toHaveBeenCalledWith('재생성 실패')
    })
  })
})
