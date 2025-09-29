import type { CSSProperties } from 'react'
import { memo } from 'react'
import { Card } from './ui/card'
import { Progress } from './ui/progress'

interface PlayerAreaProps {
  playerNumber: 1 | 2
  progress: number
  children: React.ReactNode
  isWinner: boolean
}

export const PlayerArea = memo(({ playerNumber, progress, children, isWinner }: PlayerAreaProps) => {
  const isPlayer1 = playerNumber === 1
  const clampedProgress = Math.max(0, Math.min(progress, 100))
  const adjustedProgress = 4 + (clampedProgress / 100) * 92

  const turtleTrackStyle: CSSProperties = {
    top: 'calc(6.5rem * var(--spacing-scale, 1))',
    bottom: 'calc(3.5rem * var(--spacing-scale, 1))'
  }

  return (
    <Card className="relative h-full border-4 border-primary game-area overflow-hidden">
      {/* Player Header */}
      <div className={`absolute top-4 left-4 right-4 z-20 ${isWinner ? 'celebrate' : ''}`}>
        <div className={`${isPlayer1 ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'} px-4 py-2 rounded-full text-center font-bold shadow-lg`}
          style={{ fontSize: `calc(1.125rem * var(--font-scale, 1))` }}>
          Player {playerNumber}
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

      {/* Turtle Character */}
      <div className="absolute inset-x-0 pointer-events-none flex justify-center" style={turtleTrackStyle}>
        <div className="relative h-full flex items-end justify-center" style={{ width: `calc(5rem * var(--spacing-scale, 1))` }}>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 text-2xl opacity-80">
            🏁
          </div>
          <div
            className={`absolute left-1/2 -translate-x-1/2 transition-all duration-500 ${clampedProgress > 95 ? 'turtle-hop' : ''}`}
            style={{
              bottom: `${adjustedProgress}%`,
              filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
              fontSize: `calc(3.75rem * var(--turtle-scale, 1))`
            }}
          >
            🐢
          </div>
        </div>
      </div>

      {/* Winner Overlay */}
      {isWinner && (
        <div className="absolute inset-0 bg-success/20 flex items-center justify-center z-30">
          <div className="text-center bounce-in">
            <div className="text-8xl mb-4">🏆</div>
            <div className={`${isPlayer1 ? 'text-primary' : 'text-secondary'} text-3xl font-bold drop-shadow-lg`}>
              Winner!
            </div>
          </div>
        </div>
      )}
    </Card>
  )
})
