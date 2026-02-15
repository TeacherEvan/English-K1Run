import { memo } from 'react'
import type { GameCategory } from '../types/game'
import { Badge } from './ui/badge'
import { Card } from './ui/card'

interface TargetDisplayProps {
  currentTarget: string
  targetEmoji: string
  category: GameCategory
  timeRemaining?: number
  onClick?: () => void
  /** Current point multiplier from combo system */
  multiplier?: number
}

export const TargetDisplay = memo(({ currentTarget, targetEmoji, category, timeRemaining, onClick, multiplier }: TargetDisplayProps) => {
  // Determine if multiplier is active (greater than 1)
  const hasActiveMultiplier = multiplier && multiplier > 1

  return (
    <Card data-testid="target-display" className="bg-transparent text-foreground cursor-pointer hover:scale-105 transition-transform"
      onClick={onClick}
      style={{
        padding: `calc(0.3rem * var(--spacing-scale, 1))`,
        // Very subtle background - minimal obstruction
        backgroundColor: hasActiveMultiplier ? 'rgba(255, 251, 235, 0.88)' : 'rgba(255, 255, 255, 0.65)',
        border: hasActiveMultiplier ? '2px solid rgba(251, 191, 36, 0.7)' : '1px solid rgba(255, 255, 255, 0.8)',
        boxShadow: hasActiveMultiplier
          ? '0 2px 6px rgba(251, 191, 36, 0.2), 0 0 12px rgba(251, 191, 36, 0.12)'
          : '0 2px 6px rgba(0, 0, 0, 0.08), 0 0 8px rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(4px)',
        borderRadius: '8px',
        maxWidth: 'fit-content',
        minWidth: '85px',
        pointerEvents: onClick ? 'auto' : 'none' // Enable clicks when handler is provided
      }}>
      <div className="text-center">
        {/* Multiplier Badge - shown when combo multiplier is active */}
        {hasActiveMultiplier && (
          <Badge variant="default" className="mb-1 font-bold animate-pulse"
            style={{
              fontSize: `calc(0.55rem * var(--font-scale, 1))`,
              padding: `calc(0.1rem * var(--spacing-scale, 1)) calc(0.3rem * var(--spacing-scale, 1))`,
              backgroundColor: 'rgba(251, 191, 36, 0.9)',
              color: 'rgb(120, 53, 15)',
              border: '1px solid rgba(217, 119, 6, 0.5)',
              fontWeight: '700'
            }}>
            🔥 {multiplier}x
          </Badge>
        )}

        <Badge variant="secondary" className="mb-1 font-semibold"
          style={{
            fontSize: `calc(0.6rem * var(--font-scale, 1))`,
            padding: `calc(0.15rem * var(--spacing-scale, 1)) calc(0.35rem * var(--spacing-scale, 1))`,
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            color: 'rgb(30, 64, 175)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            fontWeight: '600'
          }}>
          {category.name}
        </Badge>

        <div className="text-center mb-1">
          <div data-testid="target-emoji" className="mb-1 bounce-in" key={targetEmoji}
            style={{
              fontSize: `calc(1.75rem * var(--object-scale, 1))`,
              lineHeight: '1',
              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.12))'
            }}>
            {targetEmoji}
          </div>
          <div data-testid="target-name" className="font-bold"
            style={{
              fontSize: `calc(0.8rem * var(--font-scale, 1))`,
              color: 'rgb(30, 64, 175)',
              textShadow: '0 1px 2px rgba(255,255,255,0.8)',
              letterSpacing: '0.01em'
            }}>
            Find: {currentTarget}
          </div>
        </div>

        {category.requiresSequence && (
          <div className="font-medium"
            style={{
              fontSize: `calc(0.65rem * var(--font-scale, 1))`,
              color: 'rgb(220, 38, 38)',
              fontWeight: '600',
              marginTop: '0.2rem'
            }}>
            📝 In Order
          </div>
        )}

        {timeRemaining !== undefined && timeRemaining > 0 && !category.requiresSequence && (
          <div style={{ marginTop: `calc(0.4rem * var(--spacing-scale, 1))` }}>
            <div className="font-medium"
              style={{
                fontSize: `calc(0.65rem * var(--font-scale, 1))`,
                color: 'rgb(120, 113, 108)',
                fontWeight: '500'
              }}>
              {Math.ceil(timeRemaining / 1000)}s
            </div>
            <div
              className="rounded-full overflow-hidden"
              style={{
                height: `calc(0.375rem * var(--spacing-scale, 1))`,
                marginTop: `calc(0.25rem * var(--spacing-scale, 1))`,
                backgroundColor: 'rgba(229, 231, 235, 0.8)'
              }}
            >
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${(timeRemaining / 10000) * 100}%`,
                  backgroundColor: 'rgb(34, 197, 94)',
                  boxShadow: '0 0 8px rgba(34, 197, 94, 0.5)'
                }}
              />
            </div>
          </div>
        )}
      </div>
    </Card>
  )
})
