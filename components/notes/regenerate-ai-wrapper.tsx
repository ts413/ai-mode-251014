// components/notes/regenerate-ai-wrapper.tsx
// RegenerateAI 컴포넌트를 래핑하는 클라이언트 컴포넌트
// 서버 컴포넌트에서 클라이언트 컴포넌트로 함수를 전달할 수 없으므로 래퍼 사용
// 관련 파일: components/notes/regenerate-ai.tsx, app/notes/[id]/page.tsx

'use client'

import { RegenerateAI } from './regenerate-ai'

interface RegenerateAIWrapperProps {
  noteId: string
  showLimitInfo?: boolean
  className?: string
}

export function RegenerateAIWrapper({
  noteId,
  showLimitInfo = true,
  className = ''
}: RegenerateAIWrapperProps) {
  const handleSuccess = (result: { summary?: string; tags?: string[] }) => {
    console.log('재생성 성공:', result)
    // 페이지 새로고침으로 UI 업데이트
    window.location.reload()
  }

  const handleError = (error: string) => {
    console.error('재생성 실패:', error)
  }

  return (
    <RegenerateAI
      noteId={noteId}
      showLimitInfo={showLimitInfo}
      className={className}
      onSuccess={handleSuccess}
      onError={handleError}
    />
  )
}
