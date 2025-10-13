import { memo } from 'react'
import { getAudioDebugInfo, playSoundEffect } from '../lib/sound-manager'
import { Button } from './ui/button'
import { Card } from './ui/card'

interface GameMenuProps {
  onStartGame: () => void
  onResetGame: () => void
  onSelectLevel: (levelIndex: number) => void
  selectedLevel: number
  levels: string[]
  gameStarted: boolean
  winner: boolean
}

export const GameMenu = memo(({
  onStartGame,
  onResetGame,
  onSelectLevel,
  selectedLevel,
  levels,
  gameStarted,
  winner
}: GameMenuProps) => {
  if (gameStarted && !winner) return null

  const headingFontSize = { fontSize: `calc(1.875rem * var(--font-scale, 1))` }
  const bodyFontSize = { fontSize: `calc(1.125rem * var(--font-scale, 1))` }

  return (
    <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center z-50">
      <Card className="p-8 max-w-2xl mx-4 text-center bg-card shadow-2xl border-4 border-primary/20">
        <div className="mb-6 flex flex-col items-center gap-3">
          <div style={{ fontSize: `calc(3.75rem * var(--object-scale, 1))` }}>
            {winner ? '🏆' : '��🏁'}
          </div>
          <h1 className="font-bold text-primary" style={headingFontSize}>
            Kindergarten Race
          </h1>
          <p className="text-muted-foreground" style={bodyFontSize}>
            {winner
              ? 'You won! Pick any level and start a new race.'
              : 'Pick a level and get ready to tap the correct objects to advance!'}
          </p>
        </div>

        <div className="mb-6">
          <div className="grid gap-2 sm:grid-cols-2">
            {levels.map((name, index) => {
              const isSelected = index === selectedLevel
              return (
                <Button
                  key={`${index}-${name}`}
                  type="button"
                  variant={isSelected ? 'default' : 'outline'}
                  onClick={() => onSelectLevel(index)}
                  className="justify-between text-left"
                  style={{ fontSize: `calc(1rem * var(--font-scale, 1))` }}
                >
                  <span className="font-semibold">Level {index + 1}</span>
                  <span className="truncate text-sm text-muted-foreground ml-2">
                    {name}
                  </span>
                </Button>
              )
            })}
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            onClick={onStartGame}
            size="lg"
            className="font-bold flex-1"
            style={{
              fontSize: `calc(1.25rem * var(--font-scale, 1))`,
              padding: `calc(1rem * var(--spacing-scale, 1)) calc(2rem * var(--spacing-scale, 1))`
            }}
          >
            🚀 Start Race
          </Button>
          <Button
            onClick={() => {
              playSoundEffect.tap()
              // Log debug info to console for Vercel troubleshooting
              console.log('[Audio Debug]', getAudioDebugInfo())
            }}
            size="lg"
            variant="outline"
            className="font-bold sm:w-auto"
            style={{
              fontSize: `calc(1rem * var(--font-scale, 1))`,
              padding: `calc(1rem * var(--spacing-scale, 1))`
            }}
          >
            🔊 Test Audio
          </Button>
        </div>

        <Button
          onClick={onResetGame}
          variant="ghost"
          className="mt-6 text-sm text-muted-foreground"
        >
          Reset to Level 1 & pause game
        </Button>
      </Card>
    </div>
  )
})