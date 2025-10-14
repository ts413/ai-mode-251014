// components/notes/summary-loading.tsx
// 요약 생성 중 로딩 상태를 표시하는 컴포넌트
// AI 요약 생성 중 사용자에게 진행 상황을 알림
// 관련 파일: components/notes/note-summary.tsx, app/notes/[id]/page.tsx

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, Loader2 } from 'lucide-react'

export function SummaryLoading() {
  return (
    <Card className="mb-6 border-purple-200 bg-purple-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <CardTitle className="text-lg text-purple-900">AI 요약 생성 중</CardTitle>
        </div>
        <CardDescription className="text-purple-700">
          AI가 노트 내용을 분석하여 요약을 생성하고 있습니다
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
          <span className="text-gray-600">잠시만 기다려주세요...</span>
        </div>
        <div className="mt-3 text-xs text-gray-500">
          일반적으로 5-10초 정도 소요됩니다
        </div>
      </CardContent>
    </Card>
  )
}
