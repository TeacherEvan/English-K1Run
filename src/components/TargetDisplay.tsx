import { memo } from 'react'
import { Card } from './ui/card'
import { Badge } from './ui/badge'
import { GameCategory } from '../hooks/use-game-logic'

interface TargetDisplayProps {
  currentTarget: string
  targetEmoji: string
  category: GameCategory
  timeRemaining?: number
}

export const TargetDisplay = memo(({ currentTarget, targetEmoji, category, timeRemaining }: TargetDisplayProps) => {
  return (
    <Card className="bg-accent text-accent-foreground p-6 shadow-lg border-4 border-accent/30">
      <div className="text-center">
        <Badge variant="secondary" className="mb-3 font-semibold"
               style={{ fontSize: `calc(0.875rem * var(--font-scale, 1))` }}>
          {category.name}
        </Badge>
        
        <div className="text-center mb-3">
          <div className="mb-2 bounce-in" key={targetEmoji}
               style={{ fontSize: `calc(3.75rem * var(--object-scale, 1))` }}>
            {targetEmoji}
          </div>
          <div className="font-bold"
               style={{ fontSize: `calc(1.25rem * var(--font-scale, 1))` }}>
            Find: {currentTarget}
          </div>
        </div>

        {category.requiresSequence && (
          <div className="font-medium opacity-90"
               style={{ fontSize: `calc(0.875rem * var(--font-scale, 1))` }}>
            📝 Tap in alphabetical order!
          </div>
        )}

        {timeRemaining !== undefined && timeRemaining > 0 && !category.requiresSequence && (
          <div className="mt-3">
            <div className="font-medium opacity-90"
                 style={{ fontSize: `calc(0.875rem * var(--font-scale, 1))` }}>
              New target in: {Math.ceil(timeRemaining / 1000)}s
            </div>
            <div 
              className="bg-accent-foreground/20 rounded-full mt-1 overflow-hidden"
              style={{ height: `calc(0.5rem * var(--spacing-scale, 1))` }}
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