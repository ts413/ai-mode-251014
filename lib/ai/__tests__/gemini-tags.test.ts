// lib/ai/__tests__/gemini-tags.test.ts
// Gemini API 태그 생성 기능 테스트
// 태그 생성 프롬프트와 응답 파싱 로직 검증
// 관련 파일: lib/ai/gemini.ts, lib/notes/actions.ts

import { createTagPrompt } from '@/lib/ai/gemini'

describe('Gemini API 태그 생성', () => {
  describe('createTagPrompt', () => {
    it('태그 생성 프롬프트를 올바르게 생성해야 함', () => {
      const content = 'React와 TypeScript를 사용한 웹 개발에 대한 노트입니다.'
      const prompt = createTagPrompt(content)
      
      expect(prompt).toContain('주요 주제와 키워드를 바탕으로')
      expect(prompt).toContain('최대 6개의 관련 태그를 생성')
      expect(prompt).toContain('2-3단어로 구성하고 쉼표로 구분')
      expect(prompt).toContain(content)
    })

    it('빈 내용에 대해 적절한 프롬프트를 생성해야 함', () => {
      const content = ''
      const prompt = createTagPrompt(content)
      
      expect(prompt).toContain('다음 텍스트의')
      expect(prompt).toContain('태그:')
    })

    it('긴 내용에 대해서도 프롬프트를 생성해야 함', () => {
      const content = 'A'.repeat(1000)
      const prompt = createTagPrompt(content)
      
      expect(prompt).toContain(content)
      expect(prompt.length).toBeGreaterThan(1000)
    })
  })

  describe('태그 파싱 로직', () => {
    it('쉼표로 구분된 태그를 올바르게 파싱해야 함', () => {
      const tagContent = 'react, typescript, 웹개발, frontend, javascript, ui'
      const tagsArray = tagContent
        .split(',')
        .map(tag => tag.trim().toLowerCase())
        .filter(tag => tag.length > 0)
        .slice(0, 6)
      
      expect(tagsArray).toEqual([
        'react', 'typescript', '웹개발', 'frontend', 'javascript', 'ui'
      ])
    })

    it('빈 태그를 필터링해야 함', () => {
      const tagContent = 'react, , typescript, , 웹개발'
      const tagsArray = tagContent
        .split(',')
        .map(tag => tag.trim().toLowerCase())
        .filter(tag => tag.length > 0)
        .slice(0, 6)
      
      expect(tagsArray).toEqual(['react', 'typescript', '웹개발'])
    })

    it('태그를 소문자로 정규화해야 함', () => {
      const tagContent = 'React, TypeScript, JavaScript'
      const tagsArray = tagContent
        .split(',')
        .map(tag => tag.trim().toLowerCase())
        .filter(tag => tag.length > 0)
        .slice(0, 6)
      
      expect(tagsArray).toEqual(['react', 'typescript', 'javascript'])
    })

    it('최대 6개 태그로 제한해야 함', () => {
      const tagContent = 'tag1, tag2, tag3, tag4, tag5, tag6, tag7, tag8'
      const tagsArray = tagContent
        .split(',')
        .map(tag => tag.trim().toLowerCase())
        .filter(tag => tag.length > 0)
        .slice(0, 6)
      
      expect(tagsArray).toHaveLength(6)
      expect(tagsArray).toEqual(['tag1', 'tag2', 'tag3', 'tag4', 'tag5', 'tag6'])
    })

    it('공백이 있는 태그를 올바르게 처리해야 함', () => {
      const tagContent = ' react , typescript , 웹 개발 '
      const tagsArray = tagContent
        .split(',')
        .map(tag => tag.trim().toLowerCase())
        .filter(tag => tag.length > 0)
        .slice(0, 6)
      
      expect(tagsArray).toEqual(['react', 'typescript', '웹 개발'])
    })
  })
})
