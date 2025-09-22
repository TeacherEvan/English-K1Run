import { memo } from 'react'
import { playSoundEffect } from '../lib/sound-manager'
import { Button } from './ui/button'
import { Card } from './ui/card'

interface GameMenuProps {
  onStartGame: () => void
  onNextLevel?: () => void
  onResetGame: () => void
  gameStarted: boolean
  winner: number | null
  level: number
  categoryName: string
  maxLevel: number
}

export const GameMenu = memo(({
  onStartGame,
  onNextLevel,
  onResetGame,
  gameStarted,
  winner,
  level,
  categoryName,
  maxLevel
}: GameMenuProps) => {
  if (gameStarted && !winner) return null

  return (
    <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center z-50">
      <Card className="p-8 max-w-md mx-4 text-center bg-card shadow-2xl border-4 border-primary/20">
        {!gameStarted ? (
          <>
            <div className="mb-4" style={{ fontSize: `calc(3.75rem * var(--object-scale, 1))` }}>🏁</div>
            <h1 className="font-bold text-primary mb-2"
              style={{ fontSize: `calc(1.875rem * var(--font-scale, 1))` }}>
              Kindergarten Race
            </h1>
            <p className="text-muted-foreground mb-6"
              style={{ fontSize: `calc(1.125rem * var(--font-scale, 1))` }}>
              Ready to race? Tap the correct objects to move your turtle forward!
            </p>
            <div className="mb-6">
              <div className="font-semibold text-accent mb-2"
                style={{ fontSize: `calc(0.875rem * var(--font-scale, 1))` }}>
                Current Level: {level + 1}
              </div>
              <div className="font-medium text-foreground"
                style={{ fontSize: `calc(1.125rem * var(--font-scale, 1))` }}>
                {categoryName}
              </div>
            </div>
            <div className="flex gap-2 mb-4">
              <Button
                onClick={onStartGame}
                size="lg"
                className="font-bold flex-1"
                style={{
                  fontSize: `calc(1.25rem * var(--font-scale, 1))`,
                  padding: `calc(1rem * var(--spacing-scale, 1)) calc(2rem * var(--spacing-scale, 1))`
                }}
              >
                🚀 Start Race!
              </Button>
              <Button
                onClick={() => playSoundEffect.tap()}
                size="lg"
                variant="outline"
                className="font-bold"
                style={{
                  fontSize: `calc(1rem * var(--font-scale, 1))`,
                  padding: `calc(1rem * var(--spacing-scale, 1))`
                }}
              >
                🔊
              </Button>
            </div>
          </>
        ) : winner ? (
          <>
            <div className="mb-4 celebrate" style={{ fontSize: `calc(5rem * var(--object-scale, 1))` }}>🎉</div>
            <h2 className="font-bold text-success mb-2"
              style={{ fontSize: `calc(1.875rem * var(--font-scale, 1))` }}>
              Player {winner} Wins!
            </h2>
            <p className="text-muted-foreground mb-6"
              style={{ fontSize: `calc(1.125rem * var(--font-scale, 1))` }}>
              Great job! What would you like to do next?
            </p>
            <div className="space-y-3">
              {level < maxLevel - 1 && onNextLevel && (
                <Button
                  onClick={onNextLevel}
                  size="lg"
                  className="w-full font-bold"
                  variant="default"
                  style={{ fontSize: `calc(1.125rem * var(--font-scale, 1))` }}
                >
                  🎯 Next Level
                </Button>
              )}
              <Button
                onClick={onResetGame}
                size="lg"
                className="w-full font-bold"
                variant="secondary"
                style={{ fontSize: `calc(1.125rem * var(--font-scale, 1))` }}
              >
                🔄 Play Again
              </Button>
            </div>
          </>
        ) : null}
      </Card>
    </div>
  )
})