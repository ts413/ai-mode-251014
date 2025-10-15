// lib/ai/error-logger.ts
// AI 에러 로깅 시스템
// 구조화된 에러 로그 저장, 에러 통계 수집, 에러 해결 추적
// 관련 파일: lib/db/schema/notes.ts, lib/ai/error-handler.ts

import { db } from '@/lib/db/connection'
import { aiErrorLogs, type NewAIErrorLog } from '@/lib/db/schema/notes'
import { AIError, normalizeErrorMessage } from './error-handler'
import { eq, gte, desc, and } from 'drizzle-orm'

export interface ErrorStats {
  totalErrors: number
  errorsByType: Record<string, number>
  errorsBySeverity: Record<string, number>
  recentErrors: number
  resolvedErrors: number
  averageResolutionTime: number
}

export interface ErrorLogEntry {
  id: string
  noteId?: string
  errorType: string
  errorMessage: string
  severity: string
  retryCount: number
  createdAt: Date
  resolvedAt?: Date
}

// 에러 로그 저장
export async function logError(
  error: AIError,
  userId: string,
  noteId?: string,
  retryCount: number = 0
): Promise<string> {
  try {
    const errorLog: NewAIErrorLog = {
      noteId: noteId || null,
      errorType: error.type,
      errorMessage: normalizeErrorMessage(error.originalError || new Error(error.message)),
      stackTrace: error.originalError?.stack || null,
      userId,
      severity: error.severity,
      retryCount: retryCount.toString(),
      resolvedAt: null
    }
    
    const [result] = await db.insert(aiErrorLogs).values(errorLog).returning({ id: aiErrorLogs.id })
    
    console.error('AI 에러 로그 저장됨:', {
      id: result.id,
      type: error.type,
      severity: error.severity,
      message: error.message
    })
    
    return result.id
  } catch (logError) {
    console.error('에러 로그 저장 실패:', logError)
    return 'unknown'
  }
}

// 에러 해결 표시
export async function markErrorResolved(errorLogId: string): Promise<boolean> {
  try {
    await db
      .update(aiErrorLogs)
      .set({ resolvedAt: new Date() })
      .where(eq(aiErrorLogs.id, errorLogId))
    
    return true
  } catch (error) {
    console.error('에러 해결 표시 실패:', error)
    return false
  }
}

// 에러 통계 조회
export async function getErrorStats(userId?: string, days: number = 30): Promise<ErrorStats> {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    const whereConditions = [gte(aiErrorLogs.createdAt, startDate)]
    if (userId) {
      whereConditions.push(eq(aiErrorLogs.userId, userId))
    }
    
    const errors = await db
      .select({
        errorType: aiErrorLogs.errorType,
        severity: aiErrorLogs.severity,
        createdAt: aiErrorLogs.createdAt,
        resolvedAt: aiErrorLogs.resolvedAt
      })
      .from(aiErrorLogs)
      .where(and(...whereConditions))
    
    const stats: ErrorStats = {
      totalErrors: errors.length,
      errorsByType: {},
      errorsBySeverity: {},
      recentErrors: 0,
      resolvedErrors: 0,
      averageResolutionTime: 0
    }
    
    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const resolutionTimes: number[] = []
    
    errors.forEach(error => {
      // 에러 타입별 통계
      stats.errorsByType[error.errorType] = (stats.errorsByType[error.errorType] || 0) + 1
      
      // 심각도별 통계
      stats.errorsBySeverity[error.severity] = (stats.errorsBySeverity[error.severity] || 0) + 1
      
      // 최근 에러 (24시간 내)
      if (error.createdAt >= oneDayAgo) {
        stats.recentErrors++
      }
      
      // 해결된 에러
      if (error.resolvedAt) {
        stats.resolvedErrors++
        const resolutionTime = error.resolvedAt.getTime() - error.createdAt.getTime()
        resolutionTimes.push(resolutionTime)
      }
    })
    
    // 평균 해결 시간 계산 (밀리초를 분으로 변환)
    if (resolutionTimes.length > 0) {
      stats.averageResolutionTime = resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length / (1000 * 60)
    }
    
    return stats
  } catch (error) {
    console.error('에러 통계 조회 실패:', error)
    return {
      totalErrors: 0,
      errorsByType: {},
      errorsBySeverity: {},
      recentErrors: 0,
      resolvedErrors: 0,
      averageResolutionTime: 0
    }
  }
}

// 에러 로그 조회
export async function getErrorLogs(
  userId?: string,
  limit: number = 50,
  offset: number = 0
): Promise<ErrorLogEntry[]> {
  try {
    const whereConditions = []
    if (userId) {
      whereConditions.push(eq(aiErrorLogs.userId, userId))
    }
    
    const logs = await db
      .select()
      .from(aiErrorLogs)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(aiErrorLogs.createdAt))
      .limit(limit)
      .offset(offset)
    
    return logs.map(log => ({
      id: log.id,
      noteId: log.noteId || undefined,
      errorType: log.errorType,
      errorMessage: log.errorMessage,
      severity: log.severity,
      retryCount: parseInt(log.retryCount),
      createdAt: log.createdAt,
      resolvedAt: log.resolvedAt || undefined
    }))
  } catch (error) {
    console.error('에러 로그 조회 실패:', error)
    return []
  }
}

// 에러 패턴 분석
export async function analyzeErrorPatterns(userId?: string, days: number = 7): Promise<{
  mostCommonErrors: Array<{ type: string; count: number }>
  errorTrends: Array<{ date: string; count: number }>
  criticalErrors: number
}> {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    const whereConditions = [gte(aiErrorLogs.createdAt, startDate)]
    if (userId) {
      whereConditions.push(eq(aiErrorLogs.userId, userId))
    }
    
    const errors = await db
      .select({
        errorType: aiErrorLogs.errorType,
        severity: aiErrorLogs.severity,
        createdAt: aiErrorLogs.createdAt
      })
      .from(aiErrorLogs)
      .where(and(...whereConditions))
    
    // 가장 흔한 에러 타입
    const errorTypeCounts: Record<string, number> = {}
    const errorTrends: Record<string, number> = {}
    let criticalErrors = 0
    
    errors.forEach(error => {
      // 에러 타입별 카운트
      errorTypeCounts[error.errorType] = (errorTypeCounts[error.errorType] || 0) + 1
      
      // 날짜별 트렌드
      const date = error.createdAt.toISOString().split('T')[0]
      errorTrends[date] = (errorTrends[date] || 0) + 1
      
      // 심각한 에러 카운트
      if (error.severity === 'CRITICAL' || error.severity === 'HIGH') {
        criticalErrors++
      }
    })
    
    // 가장 흔한 에러 타입 정렬
    const mostCommonErrors = Object.entries(errorTypeCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
    
    // 에러 트렌드 정렬
    const errorTrendsArray = Object.entries(errorTrends)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
    
    return {
      mostCommonErrors,
      errorTrends: errorTrendsArray,
      criticalErrors
    }
  } catch (error) {
    console.error('에러 패턴 분석 실패:', error)
    return {
      mostCommonErrors: [],
      errorTrends: [],
      criticalErrors: 0
    }
  }
}

// 에러 알림 생성
export async function generateErrorAlert(
  error: AIError,
  context: { noteId?: string; userId: string }
): Promise<{
  shouldAlert: boolean
  alertMessage: string
  priority: 'low' | 'medium' | 'high' | 'critical'
}> {
  const shouldAlert = error.severity === 'CRITICAL' || error.severity === 'HIGH'
  
  let alertMessage = ''
  let priority: 'low' | 'medium' | 'high' | 'critical' = 'low'
  
  if (error.severity === 'CRITICAL') {
    alertMessage = `심각한 AI 에러가 발생했습니다: ${error.userMessage}`
    priority = 'critical'
  } else if (error.severity === 'HIGH') {
    alertMessage = `AI 서비스에 문제가 있습니다: ${error.userMessage}`
    priority = 'high'
  } else if (error.severity === 'MEDIUM') {
    alertMessage = `AI 처리 중 문제가 발생했습니다: ${error.userMessage}`
    priority = 'medium'
  } else {
    alertMessage = `AI 처리 중 경고가 발생했습니다: ${error.userMessage}`
    priority = 'low'
  }
  
  return {
    shouldAlert,
    alertMessage,
    priority
  }
}
