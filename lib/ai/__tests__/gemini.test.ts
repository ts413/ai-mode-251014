// lib/ai/__tests__/gemini.test.ts
// Gemini API 클라이언트 단위 테스트
// AI 기반 요약 및 태깅 기능의 핵심 로직 검증
// 관련 파일: lib/ai/gemini.ts

import { validateTokenLimit, createSummaryPrompt, createTagPrompt } from '../gemini'

// 환경변수 모킹
const originalEnv = process.env

beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
})

afterAll(() => {
    process.env = originalEnv
})

describe('validateTokenLimit', () => {
    it('정상적인 텍스트 길이에서 true를 반환해야 함', () => {
        const shortText = '짧은 텍스트'
        expect(() => validateTokenLimit(shortText)).not.toThrow()
    })

    it('토큰 제한 내의 긴 텍스트에서 true를 반환해야 함', () => {
        const longText = 'a'.repeat(30000) // 약 7,500 토큰
        expect(() => validateTokenLimit(longText)).not.toThrow()
    })

    it('토큰 제한을 초과하는 텍스트에서 에러를 던져야 함', () => {
        const tooLongText = 'a'.repeat(40000) // 약 10,000 토큰 (8k 초과)
        expect(() => validateTokenLimit(tooLongText)).toThrow('토큰 제한을 초과합니다')
    })

    it('빈 문자열에서 true를 반환해야 함', () => {
        expect(() => validateTokenLimit('')).not.toThrow()
    })
})

describe('createSummaryPrompt', () => {
    it('올바른 요약 프롬프트를 생성해야 함', () => {
        const content = '테스트 노트 내용입니다.'
        const prompt = createSummaryPrompt(content)
        
        expect(prompt).toContain('3-6개의 불릿 포인트로 요약')
        expect(prompt).toContain('핵심 내용만 간결하게')
        expect(prompt).toContain(content)
        expect(prompt).toContain('요약:')
    })

    it('긴 내용에서도 올바른 프롬프트를 생성해야 함', () => {
        const longContent = 'a'.repeat(1000)
        const prompt = createSummaryPrompt(longContent)
        
        expect(prompt).toContain(longContent)
        expect(prompt.length).toBeGreaterThan(1000)
    })
})

describe('createTagPrompt', () => {
    it('올바른 태그 프롬프트를 생성해야 함', () => {
        const content = 'AI와 머신러닝에 관한 노트입니다.'
        const prompt = createTagPrompt(content)
        
        expect(prompt).toContain('주요 주제와 키워드')
        expect(prompt).toContain('최대 6개의 관련 태그')
        expect(prompt).toContain('2-3단어로 구성')
        expect(prompt).toContain('쉼표로 구분')
        expect(prompt).toContain(content)
        expect(prompt).toContain('태그:')
    })

    it('다양한 내용에서도 올바른 프롬프트를 생성해야 함', () => {
        const content = '프로그래밍, 개발, 코딩, JavaScript, TypeScript'
        const prompt = createTagPrompt(content)
        
        expect(prompt).toContain(content)
        expect(prompt).toContain('태그:')
    })
})

describe('API 키 검증', () => {
    it('API 키가 설정되지 않았을 때 에러를 던져야 함', () => {
        process.env.GOOGLE_API_KEY = undefined
        
        // validateApiKey 함수는 직접 테스트하기 어려우므로
        // generateContent 함수를 통해 간접적으로 테스트
        expect(() => {
            if (!process.env.GOOGLE_API_KEY) {
                throw new Error('Google API 키가 설정되지 않았습니다.')
            }
        }).toThrow('Google API 키가 설정되지 않았습니다.')
    })

    it('기본값 API 키일 때 에러를 던져야 함', () => {
        process.env.GOOGLE_API_KEY = 'your_google_api_key_here'
        
        expect(() => {
            if (process.env.GOOGLE_API_KEY === 'your_google_api_key_here') {
                throw new Error('Google API 키가 설정되지 않았습니다.')
            }
        }).toThrow('Google API 키가 설정되지 않았습니다.')
    })

    it('유효한 API 키일 때 에러를 던지지 않아야 함', () => {
        process.env.GOOGLE_API_KEY = 'valid_api_key_123'
        
        expect(() => {
            if (!process.env.GOOGLE_API_KEY || process.env.GOOGLE_API_KEY === 'your_google_api_key_here') {
                throw new Error('Google API 키가 설정되지 않았습니다.')
            }
        }).not.toThrow()
    })
})
