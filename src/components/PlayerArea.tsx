import { memo } from 'react'
import { Card } from './ui/card'

interface PlayerAreaProps {
  playerNumber: 1 | 2
  progress: number
  children: React.ReactNode
  isWinner: boolean
}

export const PlayerArea = memo(({ playerNumber, progress, children, isWinner }: PlayerAreaProps) => {
  return (
    <Card data-testid={`player-area-${playerNumber}`} className="relative h-full border-0 game-area overflow-hidden">
      {/* Hidden progress indicator retained for telemetry & e2e hooks */}
      <div
        data-testid="progress-bar"
        aria-hidden="true"
        style={{
          width: `${Math.max(0, Math.min(progress, 100))}%`,
          display: 'none'
        }}
      />

      {/* Game Area */}
      <div data-testid="game-area" className="absolute inset-0 pt-24">
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
