// components/notes/__tests__/ai-status.test.tsx
// AI 상태 컴포넌트 테스트
// AIStatus, AILoading, AICompleted, AIError 컴포넌트 렌더링 테스트
// 관련 파일: components/notes/ai-status.tsx, components/notes/ai-loading.tsx

import { render, screen } from '@testing-library/react'
import { AIStatus } from '../ai-status'
import { AILoading } from '../ai-loading'
import { AICompleted } from '../ai-completed'
import { AIError } from '../ai-error'

describe('AIStatus 컴포넌트', () => {
  it('IDLE 상태일 때 아무것도 렌더링하지 않아야 함', () => {
    const { container } = render(<AIStatus status="IDLE" />)
    expect(container.firstChild).toBeNull()
  })

  it('LOADING 상태일 때 로딩 컴포넌트를 렌더링해야 함', () => {
    render(<AIStatus status="LOADING" />)
    expect(screen.getByText('AI가 요약과 태그를 생성하고 있습니다...')).toBeInTheDocument()
  })

  it('COMPLETED 상태일 때 완료 컴포넌트를 렌더링해야 함', () => {
    render(<AIStatus status="COMPLETED" />)
    expect(screen.getByText('요약과 태그가 성공적으로 생성되었습니다!')).toBeInTheDocument()
  })

  it('ERROR 상태일 때 에러 컴포넌트를 렌더링해야 함', () => {
    render(<AIStatus status="ERROR" error="테스트 에러" />)
    expect(screen.getByText('AI 처리 실패')).toBeInTheDocument()
  })

  it('커스텀 메시지를 올바르게 표시해야 함', () => {
    render(
      <AIStatus 
        status="LOADING" 
        loadingMessage="커스텀 로딩 메시지"
        completedMessage="커스텀 완료 메시지"
      />
    )
    expect(screen.getByText('커스텀 로딩 메시지')).toBeInTheDocument()
  })
})

describe('AILoading 컴포넌트', () => {
  it('기본 로딩 메시지를 표시해야 함', () => {
    render(<AILoading />)
    expect(screen.getByText('AI가 요약과 태그를 생성하고 있습니다...')).toBeInTheDocument()
  })

  it('커스텀 로딩 메시지를 표시해야 함', () => {
    render(<AILoading message="커스텀 로딩 메시지" />)
    expect(screen.getByText('커스텀 로딩 메시지')).toBeInTheDocument()
  })

  it('진행률을 표시해야 함', () => {
    render(<AILoading showProgress={true} progress={50} />)
    expect(screen.getByText('진행률')).toBeInTheDocument()
    expect(screen.getByText('50%')).toBeInTheDocument()
  })

  it('로딩 스피너를 표시해야 함', () => {
    render(<AILoading />)
    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })
})

describe('AICompleted 컴포넌트', () => {
  it('기본 완료 메시지를 표시해야 함', () => {
    render(<AICompleted />)
    expect(screen.getByText('요약과 태그가 성공적으로 생성되었습니다!')).toBeInTheDocument()
  })

  it('미리보기를 표시해야 함', () => {
    render(
      <AICompleted 
        showPreview={true}
        summary="테스트 요약"
        tags={['react', 'typescript']}
      />
    )
    expect(screen.getByText('테스트 요약')).toBeInTheDocument()
    expect(screen.getByText('react')).toBeInTheDocument()
    expect(screen.getByText('typescript')).toBeInTheDocument()
  })

  it('성공 아이콘을 표시해야 함', () => {
    render(<AICompleted />)
    const checkIcon = document.querySelector('[data-testid="check-circle"]')
    expect(checkIcon).toBeInTheDocument()
  })
})

describe('AIError 컴포넌트', () => {
  it('에러 메시지를 표시해야 함', () => {
    render(<AIError error="테스트 에러" />)
    expect(screen.getByText('AI 처리 실패')).toBeInTheDocument()
    expect(screen.getByText('요약과 태그 생성에 실패했습니다.')).toBeInTheDocument()
  })

  it('재시도 버튼을 표시해야 함', () => {
    const mockRetry = jest.fn()
    render(<AIError error="테스트 에러" onRetry={mockRetry} />)
    expect(screen.getByText('다시 시도')).toBeInTheDocument()
  })

  it('토큰 제한 에러를 올바르게 처리해야 함', () => {
    render(<AIError error="토큰 제한 초과" />)
    expect(screen.getByText('내용이 너무 깁니다')).toBeInTheDocument()
    expect(screen.getByText('노트 내용을 줄여서 다시 시도해주세요.')).toBeInTheDocument()
  })

  it('API 키 에러를 올바르게 처리해야 함', () => {
    render(<AIError error="API 키 오류" />)
    expect(screen.getByText('AI 서비스 연결 오류')).toBeInTheDocument()
    expect(screen.getByText('AI 서비스에 연결할 수 없습니다.')).toBeInTheDocument()
  })

  it('네트워크 에러를 올바르게 처리해야 함', () => {
    render(<AIError error="네트워크 연결 실패" />)
    expect(screen.getByText('네트워크 연결 오류')).toBeInTheDocument()
    expect(screen.getByText('인터넷 연결을 확인해주세요.')).toBeInTheDocument()
  })

  it('상세 에러 정보를 표시해야 함', () => {
    render(<AIError error="테스트 에러" showDetails={true} />)
    expect(screen.getByText('기술적 세부사항 보기')).toBeInTheDocument()
  })
})
