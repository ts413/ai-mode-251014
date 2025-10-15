// components/notes/error-stats.tsx
// 에러 통계 컴포넌트
// 에러 발생률 표시, 에러 유형별 통계, 에러 트렌드 차트
// 관련 파일: lib/ai/error-logger.ts, components/notes/ai-error-display.tsx

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Clock, 
  CheckCircle,
  RefreshCw,
  BarChart3
} from 'lucide-react'
import { getErrorStats, getErrorLogs, analyzeErrorPatterns, type ErrorStats } from '@/lib/ai/error-logger'

interface ErrorStatsProps {
  userId?: string
  className?: string
}

export function ErrorStats({ userId, className = '' }: ErrorStatsProps) {
  const [stats, setStats] = useState<ErrorStats | null>(null)
  const [patterns, setPatterns] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')

  const loadStats = async () => {
    try {
      setLoading(true)
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
      
      const [statsData, patternsData] = await Promise.all([
        getErrorStats(userId, days),
        analyzeErrorPatterns(userId, days)
      ])
      
      setStats(statsData)
      setPatterns(patternsData)
    } catch (error) {
      console.error('에러 통계 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
  }, [userId, timeRange])

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            에러 통계
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!stats) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            에러 통계
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            통계를 불러올 수 없습니다.
          </div>
        </CardContent>
      </Card>
    )
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'LOW':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getErrorTypeColor = (type: string) => {
    switch (type) {
      case 'API_ERROR':
        return 'bg-red-100 text-red-800'
      case 'NETWORK_ERROR':
        return 'bg-orange-100 text-orange-800'
      case 'VALIDATION_ERROR':
        return 'bg-yellow-100 text-yellow-800'
      case 'RATE_LIMIT_ERROR':
        return 'bg-purple-100 text-purple-800'
      case 'AUTH_ERROR':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              에러 통계
            </CardTitle>
            <CardDescription>
              최근 {timeRange === '7d' ? '7일' : timeRange === '30d' ? '30일' : '90일'}간의 AI 에러 통계
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d')}
              className="text-sm border rounded px-2 py-1"
            >
              <option value="7d">7일</option>
              <option value="30d">30일</option>
              <option value="90d">90일</option>
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={loadStats}
              className="h-8 px-2"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* 전체 통계 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{stats.totalErrors}</div>
            <div className="text-sm text-muted-foreground">총 에러</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.recentErrors}</div>
            <div className="text-sm text-muted-foreground">최근 에러</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.resolvedErrors}</div>
            <div className="text-sm text-muted-foreground">해결됨</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {stats.averageResolutionTime.toFixed(1)}분
            </div>
            <div className="text-sm text-muted-foreground">평균 해결 시간</div>
          </div>
        </div>

        {/* 심각도별 통계 */}
        <div>
          <h4 className="text-sm font-medium mb-3">심각도별 에러</h4>
          <div className="space-y-2">
            {Object.entries(stats.errorsBySeverity).map(([severity, count]) => (
              <div key={severity} className="flex items-center justify-between">
                <Badge className={getSeverityColor(severity)}>
                  {severity}
                </Badge>
                <span className="text-sm font-medium">{count}개</span>
              </div>
            ))}
          </div>
        </div>

        {/* 에러 타입별 통계 */}
        <div>
          <h4 className="text-sm font-medium mb-3">에러 타입별 통계</h4>
          <div className="space-y-2">
            {Object.entries(stats.errorsByType).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <Badge variant="outline" className={getErrorTypeColor(type)}>
                  {type.replace('_', ' ')}
                </Badge>
                <span className="text-sm font-medium">{count}개</span>
              </div>
            ))}
          </div>
        </div>

        {/* 에러 패턴 분석 */}
        {patterns && (
          <div>
            <h4 className="text-sm font-medium mb-3">에러 패턴 분석</h4>
            
            {/* 가장 흔한 에러 */}
            {patterns.mostCommonErrors.length > 0 && (
              <div className="mb-4">
                <div className="text-xs text-muted-foreground mb-2">가장 흔한 에러</div>
                <div className="space-y-1">
                  {patterns.mostCommonErrors.slice(0, 3).map((error: any, index: number) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span>{error.type.replace('_', ' ')}</span>
                      <span className="font-medium">{error.count}회</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 심각한 에러 */}
            {patterns.criticalErrors > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span>심각한 에러: {patterns.criticalErrors}개</span>
              </div>
            )}

            {/* 에러 트렌드 */}
            {patterns.errorTrends.length > 0 && (
              <div>
                <div className="text-xs text-muted-foreground mb-2">에러 트렌드</div>
                <div className="flex items-center gap-1">
                  {patterns.errorTrends.slice(-7).map((trend: any, index: number) => (
                    <div
                      key={index}
                      className="flex-1 bg-muted rounded-sm h-8 flex items-end justify-center"
                      style={{ height: `${Math.max(8, (trend.count / Math.max(...patterns.errorTrends.map((t: any) => t.count))) * 32)}px` }}
                    >
                      <div className="w-full bg-red-500 rounded-sm" style={{ height: '100%' }} />
                    </div>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  최근 7일간의 에러 발생 추이
                </div>
              </div>
            )}
          </div>
        )}

        {/* 상태 표시 */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            마지막 업데이트: {new Date().toLocaleTimeString()}
          </div>
          <div className="flex items-center gap-2">
            {stats.totalErrors === 0 && (
              <div className="flex items-center gap-1 text-green-600 text-sm">
                <CheckCircle className="h-4 w-4" />
                에러 없음
              </div>
            )}
            {stats.recentErrors > 0 && (
              <div className="flex items-center gap-1 text-orange-600 text-sm">
                <TrendingUp className="h-4 w-4" />
                최근 에러 증가
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// 간단한 에러 상태 표시
interface ErrorStatusBadgeProps {
  errorCount: number
  className?: string
}

export function ErrorStatusBadge({ errorCount, className = '' }: ErrorStatusBadgeProps) {
  if (errorCount === 0) {
    return (
      <Badge variant="outline" className={`text-green-600 border-green-200 ${className}`}>
        <CheckCircle className="h-3 w-3 mr-1" />
        정상
      </Badge>
    )
  }

  if (errorCount < 5) {
    return (
      <Badge variant="outline" className={`text-yellow-600 border-yellow-200 ${className}`}>
        <AlertTriangle className="h-3 w-3 mr-1" />
        {errorCount}개 에러
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className={`text-red-600 border-red-200 ${className}`}>
      <AlertTriangle className="h-3 w-3 mr-1" />
      {errorCount}개 에러
    </Badge>
  )
}
