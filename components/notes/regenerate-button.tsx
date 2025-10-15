// components/notes/regenerate-button.tsx
// AI 재생성 버튼 컴포넌트
// 재생성 버튼 UI 및 상태 표시
// 관련 파일: components/notes/regenerate-ai.tsx, app/notes/[id]/page.tsx

'use client'

import { Button } from '@/components/ui/button'
import { RefreshCw, Loader2 } from 'lucide-react'

interface RegenerateButtonProps {
  onRegenerate: () => void
  isLoading?: boolean
  disabled?: boolean
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  children?: React.ReactNode
}

export function RegenerateButton({
  onRegenerate,
  isLoading = false,
  disabled = false,
  variant = 'outline',
  size = 'sm',
  className = '',
  children
}: RegenerateButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      onClick={onRegenerate}
      disabled={disabled || isLoading}
      className={`h-8 px-3 text-xs ${className}`}
    >
      {isLoading ? (
        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
      ) : (
        <RefreshCw className="h-3 w-3 mr-1" />
      )}
      {children || '재생성'}
    </Button>
  )
}
