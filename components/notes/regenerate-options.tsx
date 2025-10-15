// components/notes/regenerate-options.tsx
// 재생성 옵션 선택 UI 컴포넌트
// 요약만, 태그만, 전체 재생성 옵션 제공
// 관련 파일: components/notes/regenerate-ai.tsx, app/notes/[id]/page.tsx

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu'
import { RefreshCw, FileText, Tag, Zap } from 'lucide-react'

export type RegenerateType = 'summary' | 'tags' | 'both'

interface RegenerateOptionsProps {
  onRegenerate: (type: RegenerateType) => void
  isLoading?: boolean
  disabled?: boolean
  className?: string
}

export function RegenerateOptions({
  onRegenerate,
  isLoading = false,
  disabled = false,
  className = ''
}: RegenerateOptionsProps) {
  const [selectedType, setSelectedType] = useState<RegenerateType | null>(null)

  const handleRegenerate = (type: RegenerateType) => {
    setSelectedType(type)
    onRegenerate(type)
  }

  const getButtonText = () => {
    if (isLoading && selectedType) {
      switch (selectedType) {
        case 'summary':
          return '요약 재생성 중...'
        case 'tags':
          return '태그 재생성 중...'
        case 'both':
          return '전체 재생성 중...'
        default:
          return '재생성 중...'
      }
    }
    return 'AI 재생성'
  }

  const getButtonIcon = () => {
    if (isLoading) {
      return <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
    }
    return <RefreshCw className="h-3 w-3 mr-1" />
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* 빠른 재생성 버튼 (전체) */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleRegenerate('both')}
        disabled={disabled || isLoading}
        className="h-8 px-3 text-xs"
      >
        {getButtonIcon()}
        {getButtonText()}
      </Button>

      {/* 상세 옵션 드롭다운 */}
      <DropdownMenu>
        <DropdownMenuTrigger
          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 px-2 text-xs"
          disabled={disabled || isLoading}
        >
          <Zap className="h-3 w-3" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-48">
          <DropdownMenuItem
            onClick={() => handleRegenerate('summary')}
            disabled={disabled || isLoading}
            className="text-xs"
          >
            <FileText className="h-3 w-3 mr-2" />
            요약만 재생성
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleRegenerate('tags')}
            disabled={disabled || isLoading}
            className="text-xs"
          >
            <Tag className="h-3 w-3 mr-2" />
            태그만 재생성
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => handleRegenerate('both')}
            disabled={disabled || isLoading}
            className="text-xs"
          >
            <Zap className="h-3 w-3 mr-2" />
            전체 재생성
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
