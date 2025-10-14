// app/test-gemini/page.tsx
// Gemini API 동작 확인을 위한 테스트 페이지
// AI 기반 요약 및 태깅 기능의 API 연동 테스트
// 관련 파일: lib/ai/gemini.ts, lib/notes/actions.ts

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Home } from 'lucide-react'
import Link from 'next/link'

interface TestResult {
  success: boolean
  summary?: string
  tags?: string[]
  error?: string
  processingTime?: number
}

export default function TestGeminiPage() {
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<TestResult | null>(null)

  const testText = `인공지능(AI)은 컴퓨터 과학의 한 분야로, 기계가 인간의 지능을 모방하여 학습, 추론, 문제 해결 등의 작업을 수행할 수 있도록 하는 기술입니다. 

주요 AI 기술로는 머신러닝, 딥러닝, 자연어 처리, 컴퓨터 비전 등이 있으며, 이는 의료, 금융, 교통, 교육 등 다양한 분야에서 혁신을 가져오고 있습니다.

하지만 AI 기술의 발전과 함께 윤리적 문제, 일자리 대체, 개인정보 보호 등의 도전 과제도 함께 나타나고 있어, AI의 책임감 있는 개발과 활용이 중요합니다.`

  const handleTest = async () => {
    if (!inputText.trim()) {
      alert('테스트할 텍스트를 입력해주세요.')
      return
    }

    setIsLoading(true)
    setResult(null)

    const startTime = Date.now()

    try {
      const response = await fetch('/api/test-gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: inputText }),
      })

      const data = await response.json()
      const processingTime = Date.now() - startTime

      if (data.success) {
        setResult({
          success: true,
          summary: data.summary,
          tags: data.tags,
          processingTime,
        })
      } else {
        setResult({
          success: false,
          error: data.error,
          processingTime,
        })
      }
    } catch (error) {
      const processingTime = Date.now() - startTime
      setResult({
        success: false,
        error: `네트워크 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        processingTime,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUseSampleText = () => {
    setInputText(testText)
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                뒤로가기
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Home className="w-4 h-4" />
                홈으로
              </Button>
            </Link>
          </div>
        </div>
        <h1 className="text-3xl font-bold mb-2">Gemini API 테스트</h1>
        <p className="text-gray-600">
          Google Gemini API의 요약 및 태깅 기능을 테스트할 수 있습니다.
        </p>
      </div>

      <div className="grid gap-6">
        {/* 입력 섹션 */}
        <Card>
          <CardHeader>
            <CardTitle>테스트 텍스트 입력</CardTitle>
            <CardDescription>
              AI가 요약하고 태깅할 텍스트를 입력하세요.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="input-text">텍스트 내용</Label>
              <Textarea
                id="input-text"
                placeholder="테스트할 텍스트를 입력하세요..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                rows={8}
                className="mt-2"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleTest} disabled={isLoading || !inputText.trim()}>
                {isLoading ? '처리 중...' : 'AI 테스트 실행'}
              </Button>
              <Button variant="outline" onClick={handleUseSampleText}>
                샘플 텍스트 사용
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 결과 섹션 */}
        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                테스트 결과
                <Badge variant={result.success ? 'default' : 'destructive'}>
                  {result.success ? '성공' : '실패'}
                </Badge>
                {result.processingTime && (
                  <Badge variant="outline">
                    {result.processingTime}ms
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {result.success ? (
                <>
                  {/* 요약 결과 */}
                  <div>
                    <Label className="text-sm font-medium">AI 요약</Label>
                    <div className="mt-2 p-3 bg-gray-50 rounded-md">
                      <p className="whitespace-pre-wrap">{result.summary}</p>
                    </div>
                  </div>

                  {/* 태그 결과 */}
                  {result.tags && result.tags.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium">AI 태그</Label>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {result.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div>
                  <Label className="text-sm font-medium text-red-600">오류 메시지</Label>
                  <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-700">{result.error}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* API 상태 정보 */}
        <Card>
          <CardHeader>
            <CardTitle>API 상태 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>API 키 설정:</span>
                <Badge variant="outline">
                  서버에서 확인됨
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>패키지:</span>
                <span>@google/genai</span>
              </div>
              <div className="flex justify-between">
                <span>모델:</span>
                <span>gemini-2.0-flash-001</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
