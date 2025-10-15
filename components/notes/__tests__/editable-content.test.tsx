// components/notes/__tests__/editable-content.test.tsx
// 편집 UI 컴포넌트 테스트
// 편집 가능한 요약, 태그, 통합 컴포넌트 렌더링 테스트
// 관련 파일: components/notes/editable-summary.tsx, components/notes/editable-tags.tsx

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { EditableSummary } from '../editable-summary'
import { EditableTags } from '../editable-tags'
import { EditableContent } from '../editable-content'

// Mock dependencies
jest.mock('@/lib/notes/actions', () => ({
  updateSummary: jest.fn(),
  updateTags: jest.fn()
}))

jest.mock('@/lib/notes/hooks', () => ({
  useEditableContent: jest.fn(() => ({
    isEditing: false,
    value: '',
    originalValue: '',
    isSaving: false,
    error: null,
    startEditing: jest.fn(),
    stopEditing: jest.fn(),
    cancelEditing: jest.fn(),
    saveEditing: jest.fn(),
    updateValue: jest.fn(),
    updateInitialValue: jest.fn(),
    hasChanges: false
  }))
}))

describe('EditableSummary 컴포넌트', () => {
  const mockProps = {
    noteId: 'note-123',
    initialSummary: '테스트 요약',
    onSummaryChange: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('기본 렌더링이 올바르게 작동해야 함', () => {
    render(<EditableSummary {...mockProps} />)
    
    expect(screen.getByText('테스트 요약')).toBeInTheDocument()
  })

  it('편집 버튼이 표시되어야 함', () => {
    render(<EditableSummary {...mockProps} />)
    
    const editButton = screen.getByRole('button', { name: /edit/i })
    expect(editButton).toBeInTheDocument()
  })

  it('요약이 없을 때 안내 메시지를 표시해야 함', () => {
    render(<EditableSummary {...mockProps} initialSummary={null} />)
    
    expect(screen.getByText('요약이 없습니다. 클릭하여 요약을 추가하세요.')).toBeInTheDocument()
  })

  it('편집 모드에서 텍스트 영역이 표시되어야 함', () => {
    const mockUseEditableContent = import('@/lib/notes/hooks').useEditableContent
    mockUseEditableContent.mockReturnValue({
      isEditing: true,
      value: '편집 중인 요약',
      originalValue: '원본 요약',
      isSaving: false,
      error: null,
      startEditing: jest.fn(),
      stopEditing: jest.fn(),
      cancelEditing: jest.fn(),
      saveEditing: jest.fn(),
      updateValue: jest.fn(),
      updateInitialValue: jest.fn(),
      hasChanges: true
    })

    render(<EditableSummary {...mockProps} />)
    
    expect(screen.getByDisplayValue('편집 중인 요약')).toBeInTheDocument()
    expect(screen.getByText('저장')).toBeInTheDocument()
    expect(screen.getByText('취소')).toBeInTheDocument()
  })

  it('에러 메시지가 표시되어야 함', () => {
    const mockUseEditableContent = import('@/lib/notes/hooks').useEditableContent
    mockUseEditableContent.mockReturnValue({
      isEditing: true,
      value: '편집 중인 요약',
      originalValue: '원본 요약',
      isSaving: false,
      error: '저장 실패',
      startEditing: jest.fn(),
      stopEditing: jest.fn(),
      cancelEditing: jest.fn(),
      saveEditing: jest.fn(),
      updateValue: jest.fn(),
      updateInitialValue: jest.fn(),
      hasChanges: true
    })

    render(<EditableSummary {...mockProps} />)
    
    expect(screen.getByText('저장 실패')).toBeInTheDocument()
  })
})

describe('EditableTags 컴포넌트', () => {
  const mockProps = {
    noteId: 'note-123',
    initialTags: [{ tag: '태그1' }, { tag: '태그2' }],
    onTagsChange: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('기본 렌더링이 올바르게 작동해야 함', () => {
    render(<EditableTags {...mockProps} />)
    
    expect(screen.getByText('태그1')).toBeInTheDocument()
    expect(screen.getByText('태그2')).toBeInTheDocument()
  })

  it('편집 버튼이 표시되어야 함', () => {
    render(<EditableTags {...mockProps} />)
    
    const editButton = screen.getByRole('button', { name: /edit/i })
    expect(editButton).toBeInTheDocument()
  })

  it('태그가 없을 때 안내 메시지를 표시해야 함', () => {
    render(<EditableTags {...mockProps} initialTags={[]} />)
    
    expect(screen.getByText('태그가 없습니다. 클릭하여 태그를 추가하세요.')).toBeInTheDocument()
  })

  it('편집 모드에서 태그 입력 필드가 표시되어야 함', () => {
    const mockUseEditableContent = import('@/lib/notes/hooks').useEditableContent
    mockUseEditableContent.mockReturnValue({
      isEditing: true,
      value: ['태그1', '태그2'],
      originalValue: ['태그1'],
      isSaving: false,
      error: null,
      startEditing: jest.fn(),
      stopEditing: jest.fn(),
      cancelEditing: jest.fn(),
      saveEditing: jest.fn(),
      updateValue: jest.fn(),
      updateInitialValue: jest.fn(),
      hasChanges: true
    })

    render(<EditableTags {...mockProps} />)
    
    expect(screen.getByPlaceholderText('새 태그 입력...')).toBeInTheDocument()
    expect(screen.getByText('저장')).toBeInTheDocument()
    expect(screen.getByText('취소')).toBeInTheDocument()
  })

  it('태그 제거 버튼이 작동해야 함', () => {
    const mockUseEditableContent = import('@/lib/notes/hooks').useEditableContent
    const mockUpdateValue = jest.fn()
    mockUseEditableContent.mockReturnValue({
      isEditing: true,
      value: ['태그1', '태그2'],
      originalValue: ['태그1'],
      isSaving: false,
      error: null,
      startEditing: jest.fn(),
      stopEditing: jest.fn(),
      cancelEditing: jest.fn(),
      saveEditing: jest.fn(),
      updateValue: mockUpdateValue,
      updateInitialValue: jest.fn(),
      hasChanges: true
    })

    render(<EditableTags {...mockProps} />)
    
    const removeButtons = screen.getAllByRole('button', { name: /x/i })
    expect(removeButtons).toHaveLength(2) // 태그1, 태그2 각각에 제거 버튼
  })
})

describe('EditableContent 컴포넌트', () => {
  const mockProps = {
    noteId: 'note-123',
    initialSummary: '테스트 요약',
    initialTags: [{ tag: '태그1' }, { tag: '태그2' }],
    onSummaryChange: jest.fn(),
    onTagsChange: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('기본 렌더링이 올바르게 작동해야 함', () => {
    render(<EditableContent {...mockProps} />)
    
    expect(screen.getByText('요약')).toBeInTheDocument()
    expect(screen.getByText('태그')).toBeInTheDocument()
    expect(screen.getByText('테스트 요약')).toBeInTheDocument()
    expect(screen.getByText('태그1')).toBeInTheDocument()
    expect(screen.getByText('태그2')).toBeInTheDocument()
  })

  it('편집 버튼들이 표시되어야 함', () => {
    render(<EditableContent {...mockProps} />)
    
    const editButtons = screen.getAllByText('편집')
    expect(editButtons).toHaveLength(2) // 요약, 태그 각각에 편집 버튼
  })

  it('편집 모드에서 변경사항 표시가 작동해야 함', () => {
    // Mock useState for isEditing
    const mockSetIsEditing = jest.fn()
    jest.spyOn(await import('react'), 'useState')
      .mockReturnValueOnce([false, mockSetIsEditing]) // isEditing
      .mockReturnValueOnce([false, jest.fn()]) // isSaving
      .mockReturnValueOnce([null, jest.fn()]) // error
      .mockReturnValueOnce([false, jest.fn()]) // hasChanges

    render(<EditableContent {...mockProps} />)
    
    const editButtons = screen.getAllByText('편집')
    fireEvent.click(editButtons[0]) // 첫 번째 편집 버튼 클릭
    
    expect(mockSetIsEditing).toHaveBeenCalledWith(true)
  })

  it('에러 메시지가 표시되어야 함', () => {
    // Mock useState for error
    jest.spyOn(await import('react'), 'useState')
      .mockReturnValueOnce([false, jest.fn()]) // isEditing
      .mockReturnValueOnce([false, jest.fn()]) // isSaving
      .mockReturnValueOnce(['저장 실패', jest.fn()]) // error
      .mockReturnValueOnce([false, jest.fn()]) // hasChanges

    render(<EditableContent {...mockProps} />)
    
    expect(screen.getByText('저장 실패')).toBeInTheDocument()
  })
})
