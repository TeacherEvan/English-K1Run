import { memo } from 'react'
import { Card } from './ui/card'
import { Progress } from './ui/progress'

interface PlayerAreaProps {
  playerNumber: 1 | 2
  progress: number
  children: React.ReactNode
  isWinner: boolean
}

export const PlayerArea = memo(({ progress, children, isWinner }: PlayerAreaProps) => {
  return (
    <Card className="relative h-full border-0 game-area overflow-hidden">
      {/* Progress Header */}
      <div className={`absolute top-4 left-4 right-4 z-20 ${isWinner ? 'celebrate' : ''}`}>
        <div className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-center font-bold shadow-lg"
          style={{ fontSize: `calc(1.125rem * var(--font-scale, 1))` }}>
          Progress
        </div>
        <div className="mt-2">
          <Progress
            value={progress}
            className="h-3 bg-white/50"
            style={{ height: `calc(0.75rem * var(--spacing-scale, 1))` }}
          />
          <div className="text-center font-semibold mt-1 text-foreground/80"
            style={{ fontSize: `calc(0.875rem * var(--font-scale, 1))` }}>
            {Math.round(progress)}%
          </div>
        </div>
      </div>

      {/* Game Area */}
      <div className="absolute inset-0 pt-24">
        {children}
      </div>

      {/* Winner Overlay */}
      {isWinner && (
        <div className="absolute inset-0 bg-success/20 flex items-center justify-center z-30">
          <div className="text-center bounce-in">
            <div className="text-8xl mb-4">🏆</div>
            <div className="text-primary text-3xl font-bold drop-shadow-lg">
              You Win!
            </div>
          </div>
        </div>
      )}
    </Card>
  )
})
