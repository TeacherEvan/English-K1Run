import { memo } from 'react'
import { GameCategory } from '../hooks/use-game-logic'
import { Badge } from './ui/badge'
import { Card } from './ui/card'

interface TargetDisplayProps {
  currentTarget: string
  targetEmoji: string
  category: GameCategory
  timeRemaining?: number
}

export const TargetDisplay = memo(({ currentTarget, targetEmoji, category, timeRemaining }: TargetDisplayProps) => {
  return (
    <Card className="bg-transparent text-foreground mx-auto"
      style={{
        padding: `calc(0.5rem * var(--spacing-scale, 1))`,
        // Subtle background for better visibility without obstruction
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        border: '2px solid rgba(255, 255, 255, 0.95)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15), 0 0 20px rgba(255, 255, 255, 0.2)',
        backdropFilter: 'blur(8px)',
        borderRadius: '12px',
        maxWidth: 'fit-content',
        minWidth: '120px',
        pointerEvents: 'none' // Prevent clicks from passing through to falling objects below
      }}>
      <div className="text-center">
        <Badge variant="secondary" className="mb-1 font-semibold"
          style={{
            fontSize: `calc(0.7rem * var(--font-scale, 1))`,
            padding: `calc(0.25rem * var(--spacing-scale, 1)) calc(0.5rem * var(--spacing-scale, 1))`,
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            color: 'rgb(30, 64, 175)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            fontWeight: '600'
          }}>
          {category.name}
        </Badge>

        <div className="text-center mb-1">
          <div className="mb-1 bounce-in" key={targetEmoji}
            style={{
              fontSize: `calc(2.5rem * var(--object-scale, 1))`,
              lineHeight: '1',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
            }}>
            {targetEmoji}
          </div>
          <div className="font-bold"
            style={{
              fontSize: `calc(1rem * var(--font-scale, 1))`,
              color: 'rgb(30, 64, 175)',
              textShadow: '0 1px 2px rgba(255,255,255,0.8)',
              letterSpacing: '0.02em'
            }}>
            Find: {currentTarget}
          </div>
        </div>

        {category.requiresSequence && (
          <div className="font-medium"
            style={{
              fontSize: `calc(0.75rem * var(--font-scale, 1))`,
              color: 'rgb(220, 38, 38)',
              fontWeight: '600',
              marginTop: '0.25rem'
            }}>
            📝 In Order!
          </div>
        )}

        {timeRemaining !== undefined && timeRemaining > 0 && !category.requiresSequence && (
          <div style={{ marginTop: `calc(0.5rem * var(--spacing-scale, 1))` }}>
            <div className="font-medium"
              style={{
                fontSize: `calc(0.75rem * var(--font-scale, 1))`,
                color: 'rgb(120, 113, 108)',
                fontWeight: '500'
              }}>
              Next: {Math.ceil(timeRemaining / 1000)}s
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
