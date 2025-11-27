import { memo, useEffect } from 'react'
import { cn } from '../lib/utils'

export interface CoinAnimationProps {
  id: number
  x: number // percentage 0-100
  y: number // pixels
  playerSide: 'left' | 'right'
  onDismiss: () => void
}

export const CoinAnimation = memo(({ id, x, y, onDismiss }: CoinAnimationProps) => {
  useEffect(() => {
    // Auto-dismiss after 500ms to match coin sound duration
    const timer = window.setTimeout(onDismiss, 500)
    return () => window.clearTimeout(timer)
  }, [id, onDismiss])

  return (
    <div
      className="absolute z-50 pointer-events-none"
      style={{
        left: `${x}%`,
        top: `${y}px`,
        transform: 'translate(-50%, -50%)'
      }}
    >
      {/* Multiple coins cascading like slot machine win */}
      <div className="relative">
        {/* Main coin - largest */}
        <div
          className={cn(
            'absolute coin-cascade',
            'flex items-center justify-center',
            'w-16 h-16 rounded-full',
            'bg-linear-to-br from-yellow-300 via-yellow-400 to-amber-500',
            'border-4 border-yellow-200',
            'shadow-2xl'
          )}
          style={{
            left: '0',
            top: '0',
            animationDelay: '0ms'
          }}
        >
          <span className="text-3xl font-bold text-amber-900">💰</span>
        </div>

        {/* Secondary coin - offset */}
        <div
          className={cn(
            'absolute coin-cascade',
            'flex items-center justify-center',
            'w-14 h-14 rounded-full',
            'bg-linear-to-br from-yellow-300 via-yellow-400 to-amber-500',
            'border-3 border-yellow-200',
            'shadow-xl'
          )}
          style={{
            left: '30px',
            top: '-10px',
            animationDelay: '150ms'
          }}
        >
          <span className="text-2xl font-bold text-amber-900">💰</span>
        </div>

        {/* Tertiary coin - smaller */}
        <div
          className={cn(
            'absolute coin-cascade',
            'flex items-center justify-center',
            'w-12 h-12 rounded-full',
            'bg-linear-to-br from-yellow-300 via-yellow-400 to-amber-500',
            'border-2 border-yellow-200',
            'shadow-lg'
          )}
          style={{
            left: '-25px',
            top: '15px',
            animationDelay: '300ms'
          }}
        >
          <span className="text-xl font-bold text-amber-900">💰</span>
        </div>

        {/* Sparkle effects */}
        <div className="absolute -top-3 -right-3 h-4 w-4 rounded-full bg-yellow-200 animate-ping coin-sparkle" style={{ animationDelay: '0ms' }} />
        <div className="absolute top-1/2 -left-4 h-3 w-3 rounded-full bg-amber-300 animate-ping coin-sparkle" style={{ animationDelay: '200ms' }} />
        <div className="absolute -bottom-2 right-1/4 h-3.5 w-3.5 rounded-full bg-yellow-100 animate-ping coin-sparkle" style={{ animationDelay: '400ms' }} />
      </div>
    </div>
  )
})

CoinAnimation.displayName = 'CoinAnimation'
