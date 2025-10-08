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
    <Card className="bg-transparent text-foreground max-w-[10rem] mx-auto"
      style={{
        padding: `calc(0.5rem * var(--spacing-scale, 1))`,
        // Completely transparent - no background, no border, no shadow
        backgroundColor: 'transparent',
        border: 'none',
        boxShadow: 'none',
        backdropFilter: 'none',
        // 50% smaller using transform scale
        transform: 'scale(0.5)',
        transformOrigin: 'center',
        textShadow: '0 1px 2px rgba(0,0,0,0.3), 0 0 8px rgba(255,255,255,0.5)'
      }}>
      <div className="text-center">
        <Badge variant="secondary" className="mb-0.5 font-semibold"
          style={{
            fontSize: `calc(0.35rem * var(--font-scale, 1))`,
            padding: `calc(0.125rem * var(--spacing-scale, 1)) calc(0.25rem * var(--spacing-scale, 1))`,
            backgroundColor: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(4px)'
          }}>
          {category.name}
        </Badge>

        <div className="text-center mb-0.5">
          <div className="mb-0.5 bounce-in" key={targetEmoji}
            style={{
              fontSize: `min(calc(0.875rem * var(--object-scale, 1)), 1rem)`,
              lineHeight: '1',
              filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.4))'
            }}>
            {targetEmoji}
          </div>
          <div className="font-bold"
            style={{
              fontSize: `calc(0.4375rem * var(--font-scale, 1))`,
              textShadow: '0 1px 3px rgba(0,0,0,0.5), 0 0 10px rgba(255,255,255,0.6)'
            }}>
            Find: {currentTarget}
          </div>
        </div>

        {category.requiresSequence && (
          <div className="font-medium opacity-90"
            style={{
              fontSize: `calc(0.325rem * var(--font-scale, 1))`,
              textShadow: '0 1px 2px rgba(0,0,0,0.5)'
            }}>
            📝 Alphabetical!
          </div>
        )}

        {timeRemaining !== undefined && timeRemaining > 0 && !category.requiresSequence && (
          <div style={{ marginTop: `calc(0.25rem * var(--spacing-scale, 1))` }}>
            <div className="font-medium opacity-90"
              style={{
                fontSize: `calc(0.325rem * var(--font-scale, 1))`,
                textShadow: '0 1px 2px rgba(0,0,0,0.5)'
              }}>
              Next: {Math.ceil(timeRemaining / 1000)}s
            </div>
            <div
              className="bg-accent-foreground/20 rounded-full overflow-hidden"
              style={{
                height: `calc(0.125rem * var(--spacing-scale, 1))`,
                marginTop: `calc(0.125rem * var(--spacing-scale, 1))`
              }}
            >
              <div
                className="h-full bg-accent-foreground/70 rounded-full transition-all duration-1000"
                style={{
                  width: `${(timeRemaining / 10000) * 100}%`,
                  boxShadow: '0 0 4px rgba(255,255,255,0.6)'
                }}
              />
            </div>
          </div>
        )}
      </div>
    </Card>
  )
})
