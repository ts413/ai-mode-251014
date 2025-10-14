// app/api/test-gemini/route.ts
// Gemini API 테스트를 위한 API 엔드포인트
// AI 기반 요약 및 태깅 기능의 서버사이드 테스트
// 관련 파일: lib/ai/gemini.ts, app/test-gemini/page.tsx

import { NextRequest, NextResponse } from 'next/server'
import { generateContent, createSummaryPrompt, createTagPrompt } from '@/lib/ai/gemini'

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { success: false, error: '텍스트가 필요합니다.' },
        { status: 400 }
      )
    }

    if (text.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: '빈 텍스트는 처리할 수 없습니다.' },
        { status: 400 }
      )
    }

    // API 키 확인
    if (!process.env.GOOGLE_API_KEY || process.env.GOOGLE_API_KEY === 'your_google_api_key_here') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Google API 키가 설정되지 않았습니다. .env.local 파일을 확인하세요.' 
        },
        { status: 500 }
      )
    }

    // 요약 생성
    const summaryPrompt = createSummaryPrompt(text)
    const summary = await generateContent(summaryPrompt)

    // 태그 생성
    const tagPrompt = createTagPrompt(text)
    const tagContent = await generateContent(tagPrompt)
    
    // 태그 파싱 (쉼표로 구분된 태그들을 배열로 변환)
    const tags = tagContent
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
      .slice(0, 6) // 최대 6개 태그로 제한

    return NextResponse.json({
      success: true,
      summary,
      tags,
    })

  } catch (error) {
    console.error('Gemini API 테스트 실패:', error)

    let errorMessage = 'AI 처리 중 오류가 발생했습니다.'
    
    if (error instanceof Error) {
      if (error.message.includes('토큰 제한')) {
        errorMessage = '입력 텍스트가 너무 깁니다. 텍스트를 줄여주세요.'
      } else if (error.message.includes('API 키')) {
        errorMessage = 'Google API 키 설정에 문제가 있습니다.'
      } else if (error.message.includes('네트워크')) {
        errorMessage = '네트워크 연결에 문제가 있습니다.'
      } else {
        errorMessage = `AI 처리 오류: ${error.message}`
      }
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}
