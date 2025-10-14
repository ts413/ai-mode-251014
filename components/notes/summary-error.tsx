// components/notes/summary-error.tsx
// 요약 생성 실패 시 표시하는 컴포넌트
// AI 요약 생성 실패 시 사용자에게 알림 및 재시도 옵션 제공
// 관련 파일: components/notes/note-summary.tsx, lib/notes/actions.ts

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { regenerateAI } from '@/lib/notes/actions'

interface SummaryErrorProps {
  noteId: string
  error?: string
}

export function SummaryError({ noteId, error }: SummaryErrorProps) {
  const handleRetry = async () => {
    try {
      await regenerateAI(noteId)
      // 페이지 새로고침으로 요약 상태 업데이트
      window.location.reload()
    } catch (retryError) {
      console.error('요약 재생성 실패:', retryError)
    }
  }

  return (
    <Card className="mb-6 border-orange-200 bg-orange-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-600" />
          <CardTitle className="text-lg text-orange-900">AI 요약 생성 실패</CardTitle>
        </div>
        <CardDescription className="text-orange-700">
          요약 생성 중 문제가 발생했습니다
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {error && (
            <p className="text-sm text-gray-600">
              오류: {error}
            </p>
          )}
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRetry}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              다시 시도
            </Button>
            <span className="text-xs text-gray-500">
              또는 페이지를 새로고침해주세요
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
