// components/notes/__tests__/note-tags.test.tsx
// NoteTags 컴포넌트 테스트
// 태그 표시, 로딩 상태, 에러 상태 렌더링 검증
// 관련 파일: components/notes/note-tags.tsx

import { render, screen } from '@testing-library/react'
import { NoteTags } from '../note-tags'
import { type NoteTag } from '@/lib/db/schema/notes'

// Mock 데이터
const mockTags: NoteTag[] = [
  { id: '1', noteId: 'note-1', tag: 'react' },
  { id: '2', noteId: 'note-1', tag: 'typescript' },
  { id: '3', noteId: 'note-1', tag: '웹개발' }
]

describe('NoteTags 컴포넌트', () => {
  describe('태그 표시', () => {
    it('태그가 있을 때 배지로 표시해야 함', () => {
      render(<NoteTags tags={mockTags} />)
      
      expect(screen.getByText('react')).toBeInTheDocument()
      expect(screen.getByText('typescript')).toBeInTheDocument()
      expect(screen.getByText('웹개발')).toBeInTheDocument()
    })

    it('태그가 없을 때 적절한 메시지를 표시해야 함', () => {
      render(<NoteTags tags={[]} />)
      
      expect(screen.getByText('태그가 없습니다')).toBeInTheDocument()
    })

    it('태그가 null일 때 적절한 메시지를 표시해야 함', () => {
      render(<NoteTags tags={null as any} />)
      
      expect(screen.getByText('태그가 없습니다')).toBeInTheDocument()
    })
  })

  describe('로딩 상태', () => {
    it('로딩 중일 때 로딩 컴포넌트를 표시해야 함', () => {
      render(<NoteTags tags={[]} isLoading={true} />)
      
      expect(screen.getByText('AI가 태그를 생성하고 있습니다...')).toBeInTheDocument()
    })

    it('로딩 중일 때 스켈레톤을 표시해야 함', () => {
      render(<NoteTags tags={[]} isLoading={true} />)
      
      // 스켈레톤 요소들이 있는지 확인
      const skeletons = document.querySelectorAll('[data-testid="skeleton"]')
      expect(skeletons.length).toBeGreaterThan(0)
    })
  })

  describe('에러 상태', () => {
    it('에러가 있을 때 에러 메시지를 표시해야 함', () => {
      render(<NoteTags tags={[]} error="태그 생성 실패" />)
      
      expect(screen.getByText('태그 생성에 실패했습니다')).toBeInTheDocument()
    })

    it('재시도 버튼이 있을 때 재시도 버튼을 표시해야 함', () => {
      const mockRetry = jest.fn()
      render(<NoteTags tags={[]} error="태그 생성 실패" onRetry={mockRetry} />)
      
      expect(screen.getByText('재시도')).toBeInTheDocument()
    })
  })

  describe('스타일링', () => {
    it('커스텀 className을 적용해야 함', () => {
      const { container } = render(
        <NoteTags tags={mockTags} className="custom-class" />
      )
      
      expect(container.firstChild).toHaveClass('custom-class')
    })

    it('태그 배지에 올바른 스타일이 적용되어야 함', () => {
      render(<NoteTags tags={mockTags} />)
      
      const badges = screen.getAllByRole('generic')
      badges.forEach(badge => {
        expect(badge).toHaveClass('text-xs', 'px-2', 'py-1')
      })
    })
  })

  describe('접근성', () => {
    it('태그에 적절한 title 속성이 있어야 함', () => {
      render(<NoteTags tags={mockTags} />)
      
      expect(screen.getByTitle('react 태그로 필터링')).toBeInTheDocument()
      expect(screen.getByTitle('typescript 태그로 필터링')).toBeInTheDocument()
      expect(screen.getByTitle('웹개발 태그로 필터링')).toBeInTheDocument()
    })
  })
})
