// lib/ai/gemini.ts
// Google Gemini API 클라이언트 구현
// AI 기반 요약 및 태깅을 위한 Gemini API 연동
// 관련 파일: lib/notes/actions.ts, .env.local

import { GoogleGenAI } from "@google/genai";

// API 키 검증
function validateApiKey(): string {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey || apiKey === "your_google_api_key_here") {
    throw new Error("Google API 키가 설정되지 않았습니다. .env.local 파일을 확인하세요.");
  }
  return apiKey;
}

// Gemini API 클라이언트 초기화
export function initializeGeminiClient() {
  try {
    const apiKey = validateApiKey();
    const genAI = new GoogleGenAI({ apiKey });
    return genAI;
  } catch (error) {
    console.error("Gemini API 클라이언트 초기화 실패:", error);
    throw error;
  }
}

// 토큰 제한 검증 (8k 토큰 제한)
export function validateTokenLimit(text: string): boolean {
  // 대략적인 토큰 계산 (1 토큰 ≈ 4 문자)
  const estimatedTokens = text.length / 4;
  const maxTokens = 8000;
  
  if (estimatedTokens > maxTokens) {
    throw new Error(`입력 텍스트가 토큰 제한을 초과합니다. (예상: ${Math.round(estimatedTokens)} 토큰, 제한: ${maxTokens} 토큰)`);
  }
  
  return true;
}

// 텍스트 생성 함수
export async function generateContent(prompt: string): Promise<string> {
  try {
    // 토큰 제한 검증
    validateTokenLimit(prompt);
    
    // Gemini API 클라이언트 초기화
    const genAI = initializeGeminiClient();
    
    // API 호출
    const result = await genAI.models.generateContent({
      model: "gemini-2.0-flash-001",
      contents: prompt
    });
    
    if (!result.text) {
      throw new Error("AI 응답에서 텍스트를 찾을 수 없습니다.");
    }
    
    return result.text;
  } catch (error) {
    console.error("Gemini API 호출 실패:", error);
    throw error;
  }
}

// 요약 생성을 위한 프롬프트 생성
export function createSummaryPrompt(content: string): string {
  return `다음 텍스트를 3-6개의 불릿 포인트로 요약해주세요. 핵심 내용만 간결하게 정리해주세요:

${content}

요약:`;
}

// 태그 생성을 위한 프롬프트 생성
export function createTagPrompt(content: string): string {
  return `다음 텍스트의 주요 주제와 키워드를 바탕으로 최대 6개의 관련 태그를 생성해주세요. 각 태그는 2-3단어로 구성하고 쉼표로 구분해주세요:

${content}

태그:`;
}
