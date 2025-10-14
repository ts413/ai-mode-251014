// components/notes/note-summary.tsx
// 노트 요약을 표시하는 컴포넌트
// AI가 생성한 요약 내용을 불릿 포인트 형식으로 표시
// 관련 파일: app/notes/[id]/page.tsx, lib/notes/queries.ts

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sparkles } from 'lucide-react'
import type { Summary } from '@/lib/db/schema/notes'

interface NoteSummaryProps {
  summary: Summary | null
}

export function NoteSummary({ summary }: NoteSummaryProps) {
  if (!summary) {
    return null
  }

  // 요약 내용을 불릿 포인트로 파싱
  // 줄바꿈 또는 "-", "•", "*"로 시작하는 라인을 불릿 포인트로 간주
  const bulletPoints = summary.content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .filter(line => 
      line.startsWith('-') || 
      line.startsWith('•') || 
      line.startsWith('*') ||
      line.startsWith('1.') ||
      line.startsWith('2.') ||
      line.startsWith('3.') ||
      line.startsWith('4.') ||
      line.startsWith('5.') ||
      line.startsWith('6.')
    )
    .map(line => {
      // 불릿 기호 제거
      return line.replace(/^[-•*]\s*/, '').replace(/^\d+\.\s*/, '').trim()
    })

  // 불릿 포인트가 없으면 전체 텍스트를 그대로 표시
  const hasValidBullets = bulletPoints.length > 0

  return (
    <Card className="mb-6 border-purple-200 bg-purple-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <CardTitle className="text-lg text-purple-900">AI 요약</CardTitle>
          </div>
          <Badge variant="outline" className="text-purple-700 border-purple-300">
            {summary.model}
          </Badge>
        </div>
        <CardDescription className="text-purple-700">
          AI가 생성한 노트의 핵심 요약입니다
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasValidBullets ? (
          <ul className="space-y-2">
            {bulletPoints.map((point, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-purple-600 mt-1">•</span>
                <span className="flex-1 text-gray-800">{point}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-800 whitespace-pre-wrap">{summary.content}</p>
        )}
        <div className="mt-4 text-xs text-gray-500">
          생성일: {new Date(summary.createdAt).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </CardContent>
    </Card>
  )
}
