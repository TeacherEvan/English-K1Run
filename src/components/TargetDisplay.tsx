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
    <Card className="bg-background/15 backdrop-blur-xl text-foreground p-3 shadow-lg border border-accent/30 max-w-sm mx-auto">
      <div className="text-center">
        <Badge variant="secondary" className="mb-2 font-semibold"
          style={{ fontSize: `calc(0.875rem * var(--font-scale, 1))` }}>
          {category.name}
        </Badge>

        <div className="text-center mb-2">
          <div className="mb-1 bounce-in" key={targetEmoji}
            style={{
              fontSize: `min(calc(2.5rem * var(--object-scale, 1)), 3rem)`,
              lineHeight: '1.2'
            }}>
            {targetEmoji}
          </div>
          <div className="font-bold"
            style={{ fontSize: `calc(1rem * var(--font-scale, 1))` }}>
            Find: {currentTarget}
          </div>
        </div>

        {category.requiresSequence && (
          <div className="font-medium opacity-90 text-sm"
            style={{ fontSize: `calc(0.75rem * var(--font-scale, 1))` }}>
            📝 Tap in alphabetical order!
          </div>
        )}

        {timeRemaining !== undefined && timeRemaining > 0 && !category.requiresSequence && (
          <div className="mt-2">
            <div className="font-medium opacity-90 text-xs"
              style={{ fontSize: `calc(0.75rem * var(--font-scale, 1))` }}>
              New target in: {Math.ceil(timeRemaining / 1000)}s
            </div>
            <div
              className="bg-accent-foreground/20 rounded-full mt-1 overflow-hidden"
              style={{ height: `calc(0.375rem * var(--spacing-scale, 1))` }}
            >
              <div
                className="h-full bg-accent-foreground/60 rounded-full transition-all duration-1000"
                style={{ width: `${(timeRemaining / 10000) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </Card>
  )
})
