// components/notes/__tests__/ai-error-display.test.tsx
// AI 에러 표시 컴포넌트 테스트
// 에러 유형별 UI, 재시도 버튼, 대안 제시 기능 테스트
// 관련 파일: components/notes/ai-error-display.tsx

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AIErrorDisplay, ErrorStatus, ErrorSummary } from '../ai-error-display'
import { RetryState } from '@/lib/ai/retry-handler'

// Mock dependencies
jest.mock('@/lib/ai/error-handler', () => ({
  classifyError: jest.fn(),
  getErrorColor: jest.fn(),
  getErrorIcon: jest.fn()
}))

jest.mock('@/lib/ai/retry-handler', () => ({
  RetryState: jest.fn(),
  executeWithRetry: jest.fn()
}))

describe('AIErrorDisplay 컴포넌트', () => {
  const mockError = {
    type: 'API_ERROR' as const,
    severity: 'HIGH' as const,
    message: 'API connection failed',
    userMessage: 'AI 서비스에 연결할 수 없습니다',
    canRetry: true,
    retryAfter: 30,
    alternative: '수동으로 요약을 작성해보세요'
  }

  const mockProps = {
    error: mockError,
    onRetry: jest.fn(),
    onDismiss: jest.fn(),
    showDetails: false
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('기본 렌더링이 올바르게 작동해야 함', () => {
    render(<AIErrorDisplay {...mockProps} />)
    
    expect(screen.getByText('AI 서비스에 연결할 수 없습니다')).toBeInTheDocument()
    expect(screen.getByText('API ERROR')).toBeInTheDocument()
    expect(screen.getByText('HIGH')).toBeInTheDocument()
    expect(screen.getByText('수동으로 요약을 작성해보세요')).toBeInTheDocument()
  })

  it('재시도 버튼이 표시되어야 함', () => {
    render(<AIErrorDisplay {...mockProps} />)
    
    const retryButton = screen.getByText('재시도')
    expect(retryButton).toBeInTheDocument()
  })

  it('재시도 불가능한 에러에 대해 재시도 버튼이 비활성화되어야 함', () => {
    const nonRetryableError = { ...mockError, canRetry: false }
    render(<AIErrorDisplay {...mockProps} error={nonRetryableError} />)
    
    const retryButton = screen.getByText('재시도')
    expect(retryButton).toBeDisabled()
  })

  it('재시도 버튼 클릭 시 onRetry가 호출되어야 함', async () => {
    render(<AIErrorDisplay {...mockProps} />)
    
    const retryButton = screen.getByText('재시도')
    fireEvent.click(retryButton)
    
    await waitFor(() => {
      expect(mockProps.onRetry).toHaveBeenCalled()
    })
  })

  it('닫기 버튼이 표시되어야 함', () => {
    render(<AIErrorDisplay {...mockProps} />)
    
    const dismissButton = screen.getByText('닫기')
    expect(dismissButton).toBeInTheDocument()
  })

  it('닫기 버튼 클릭 시 onDismiss가 호출되어야 함', () => {
    render(<AIErrorDisplay {...mockProps} />)
    
    const dismissButton = screen.getByText('닫기')
    fireEvent.click(dismissButton)
    
    expect(mockProps.onDismiss).toHaveBeenCalled()
  })

  it('도움말 버튼이 표시되어야 함', () => {
    render(<AIErrorDisplay {...mockProps} />)
    
    const helpButton = screen.getByText('도움말')
    expect(helpButton).toBeInTheDocument()
  })

  it('상세 정보가 표시되어야 함', () => {
    render(<AIErrorDisplay {...mockProps} showDetails={true} />)
    
    expect(screen.getByText('기술적 세부사항 보기')).toBeInTheDocument()
  })

  it('재시도 대기 시간이 표시되어야 함', () => {
    render(<AIErrorDisplay {...mockProps} />)
    
    expect(screen.getByText('30초 후 재시도 가능')).toBeInTheDocument()
  })

  it('재시도 중일 때 로딩 상태가 표시되어야 함', async () => {
    const mockOnRetry = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
    render(<AIErrorDisplay {...mockProps} onRetry={mockOnRetry} />)
    
    const retryButton = screen.getByText('재시도')
    fireEvent.click(retryButton)
    
    expect(screen.getByText('재시도 중...')).toBeInTheDocument()
  })
})

describe('ErrorStatus 컴포넌트', () => {
  const mockRetryState = {
    hasError: true,
    isCurrentlyRetrying: false,
    currentAttempts: 1,
    lastErrorInfo: {
      type: 'API_ERROR' as const,
      severity: 'HIGH' as const,
      message: 'API connection failed',
      userMessage: 'AI 서비스에 연결할 수 없습니다',
      canRetry: true,
      retryAfter: 30,
      alternative: '수동으로 요약을 작성해보세요'
    }
  } as RetryState

  const mockProps = {
    retryState: mockRetryState,
    onRetry: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('에러가 없을 때 아무것도 렌더링하지 않아야 함', () => {
    const noErrorState = { ...mockRetryState, hasError: false }
    const { container } = render(<ErrorStatus {...mockProps} retryState={noErrorState} />)
    
    expect(container.firstChild).toBeNull()
  })

  it('에러가 있을 때 AIErrorDisplay를 렌더링해야 함', () => {
    render(<ErrorStatus {...mockProps} />)
    
    expect(screen.getByText('AI 서비스에 연결할 수 없습니다')).toBeInTheDocument()
  })

  it('재시도 중일 때 진행률이 표시되어야 함', () => {
    const retryingState = { ...mockRetryState, isCurrentlyRetrying: true }
    render(<ErrorStatus {...mockProps} retryState={retryingState} />)
    
    expect(screen.getByText(/재시도 진행률/)).toBeInTheDocument()
  })
})

describe('ErrorSummary 컴포넌트', () => {
  const mockErrors = [
    {
      type: 'API_ERROR' as const,
      severity: 'HIGH' as const,
      message: 'API connection failed',
      userMessage: 'AI 서비스에 연결할 수 없습니다',
      canRetry: true,
      retryAfter: 30,
      alternative: '수동으로 요약을 작성해보세요'
    },
    {
      type: 'NETWORK_ERROR' as const,
      severity: 'MEDIUM' as const,
      message: 'Network timeout',
      userMessage: '네트워크 연결을 확인해주세요',
      canRetry: true,
      retryAfter: 10,
      alternative: '네트워크가 안정된 후 다시 시도해주세요'
    }
  ]

  const mockProps = {
    errors: mockErrors,
    onRetryAll: jest.fn(),
    onDismissAll: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('에러가 없을 때 아무것도 렌더링하지 않아야 함', () => {
    const { container } = render(<ErrorSummary {...mockProps} errors={[]} />)
    
    expect(container.firstChild).toBeNull()
  })

  it('에러 요약이 표시되어야 함', () => {
    render(<ErrorSummary {...mockProps} />)
    
    expect(screen.getByText('2개의 에러가 발생했습니다')).toBeInTheDocument()
  })

  it('재시도 가능한 에러가 있을 때 재시도 버튼이 표시되어야 함', () => {
    render(<ErrorSummary {...mockProps} />)
    
    const retryAllButton = screen.getByText('모두 재시도')
    expect(retryAllButton).toBeInTheDocument()
  })

  it('재시도 불가능한 에러만 있을 때 재시도 버튼이 표시되지 않아야 함', () => {
    const nonRetryableErrors = mockErrors.map(error => ({ ...error, canRetry: false }))
    render(<ErrorSummary {...mockProps} errors={nonRetryableErrors} />)
    
    expect(screen.queryByText('모두 재시도')).not.toBeInTheDocument()
  })

  it('모두 재시도 버튼 클릭 시 onRetryAll이 호출되어야 함', () => {
    render(<ErrorSummary {...mockProps} />)
    
    const retryAllButton = screen.getByText('모두 재시도')
    fireEvent.click(retryAllButton)
    
    expect(mockProps.onRetryAll).toHaveBeenCalled()
  })

  it('모두 닫기 버튼 클릭 시 onDismissAll이 호출되어야 함', () => {
    render(<ErrorSummary {...mockProps} />)
    
    const dismissAllButton = screen.getByText('모두 닫기')
    fireEvent.click(dismissAllButton)
    
    expect(mockProps.onDismissAll).toHaveBeenCalled()
  })

  it('심각한 에러가 있을 때 배지가 표시되어야 함', () => {
    render(<ErrorSummary {...mockProps} />)
    
    expect(screen.getByText('높음: 1')).toBeInTheDocument()
  })
})
