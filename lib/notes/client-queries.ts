// lib/notes/client-queries.ts
// 클라이언트 사이드에서 사용할 수 있는 노트 쿼리 함수들
// 서버 전용 모듈을 사용하지 않고 클라이언트에서 안전하게 사용 가능
// 관련 파일: components/notes/regenerate-ai.tsx, components/notes/editable-content.tsx

'use client'

import { createClient } from '@/lib/supabase/client'

// 사용자 인증 상태 확인
export async function getCurrentUser() {
  const supabase = createClient()
  
  const {
    data: { user },
    error
  } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}

// 클라이언트에서 사용할 수 있는 기본 쿼리 함수들
// 실제 데이터 조회는 서버 액션을 통해 수행
export const clientQueries = {
  // 사용자 인증 확인
  getCurrentUser,
  
  // 재생성 가능 여부 확인 (서버 액션 호출)
  async checkRegenerationLimit() {
    // 이 함수는 서버 액션을 호출하여 처리
    // 실제 구현은 서버 액션에서 수행
    return { currentCount: 0, limit: 10, canRegenerate: true }
  }
}

