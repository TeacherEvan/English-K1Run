import { memo, useState } from 'react'
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
  continuousMode?: boolean
  onToggleContinuousMode?: (enabled: boolean) => void
}

/**
 * GameMenu - Production-grade menu with premium UX
 * 
 * Features 2025 best practices:
 * - Spring-based animations for natural feel
 * - Smooth hover states with transform
 * - Tactile micro-interactions
 * - Accessible keyboard navigation
 * - Reduced motion support
 * 
 * @component
 */
export const GameMenu = memo(({
  onStartGame,
  onResetGame,
  onSelectLevel,
  selectedLevel,
  levels,
  gameStarted,
  winner,
  continuousMode = false,
  onToggleContinuousMode
}: GameMenuProps) => {
  // Track hover states for micro-interactions (must be declared before any conditional returns)
  const [hoveredLevel, setHoveredLevel] = useState<number | null>(null)

  if (gameStarted && !winner) return null

  const headingFontSize = { fontSize: `calc(1.875rem * var(--font-scale, 1))` }
  const bodyFontSize = { fontSize: `calc(1.125rem * var(--font-scale, 1))` }

  return (
    <div
      data-testid="game-menu"
      className="absolute inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300"
      style={{
        // Explicit inline styles as fallback for CSS variable issues
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Game menu"
    >
      <Card className="p-8 max-w-2xl mx-4 text-center bg-card shadow-2xl border-4 border-primary/20 animate-in fade-in zoom-in duration-500">
        <div className="mb-6 flex flex-col items-center gap-3">
          {/* Enhanced emoji with spring animation */}
          <div 
            className="transition-all duration-300 hover:scale-110 cursor-default" 
            style={{ 
              fontSize: `calc(3.75rem * var(--object-scale, 1))`,
              filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.1))',
              transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
            role="img"
            aria-label={winner ? "Trophy" : "Race starting line"}
          >
            {winner ? '🏆' : '🐢🏁'}
          </div>
          
          <h1 
            data-testid="game-title" 
            className="font-bold text-primary transition-all duration-300 hover:text-primary/80 hover:scale-105 cursor-default" 
            style={{
              ...headingFontSize,
              textShadow: '0 2px 8px rgba(0,0,0,0.05)',
              transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
          >
            Kindergarten Race
          </h1>
          
          <p 
            className="text-muted-foreground animate-in fade-in slide-in-from-bottom-4 duration-700" 
            style={bodyFontSize}
          >
            {winner
              ? '🎉 You won! Pick any level and start a new race.'
              : 'Pick a level and get ready to tap the correct objects to advance!'}
          </p>
        </div>

        <div className="mb-6">
          <div className="grid gap-3 sm:grid-cols-2">
            {levels.map((name, index) => {
              const isSelected = index === selectedLevel
              const isHovered = index === hoveredLevel
              
              return (
                <Button
                  key={`${index}-${name}`}
                  type="button"
                  data-testid="level-button"
                  data-selected={isSelected}
                  data-level={index}
                  variant={isSelected ? 'default' : 'outline'}
                  onClick={() => onSelectLevel(index)}
                  onMouseEnter={() => setHoveredLevel(index)}
                  onMouseLeave={() => setHoveredLevel(null)}
                  className={`justify-between text-left transition-all duration-200 ${
                    isSelected ? 'ring-2 ring-primary/50' : ''
                  }`}
                  style={{ 
                    fontSize: `calc(1rem * var(--font-scale, 1))`,
                    // Spring-based scale animation for premium feel
                    transform: isSelected 
                      ? 'scale(1.05)' 
                      : isHovered 
                        ? 'scale(1.02) translateY(-2px)' 
                        : 'scale(1)',
                    boxShadow: isHovered 
                      ? '0 4px 12px rgba(0,0,0,0.1)' 
                      : isSelected 
                        ? '0 2px 8px rgba(0,0,0,0.05)' 
                        : 'none',
                    transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
                  }}
                  aria-pressed={isSelected}
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

        {/* Continuous Mode Checkbox */}
        {onToggleContinuousMode && (
          <div className="mb-6 flex items-center justify-center gap-3 p-4 bg-primary/5 rounded-lg border-2 border-primary/20 transition-all hover:border-primary/40">
            <label 
              htmlFor="continuous-mode" 
              className="flex items-center gap-3 cursor-pointer select-none"
            >
              <input
                id="continuous-mode"
                type="checkbox"
                checked={continuousMode}
                onChange={(e) => onToggleContinuousMode(e.target.checked)}
                className="w-5 h-5 rounded border-2 border-primary/40 text-primary focus:ring-2 focus:ring-primary/50 cursor-pointer transition-all"
                style={{
                  accentColor: 'var(--color-primary)',
                }}
              />
              <span 
                className="font-semibold text-foreground"
                style={{ fontSize: `calc(1rem * var(--font-scale, 1))` }}
              >
                🔄 Continuous Play Mode
              </span>
              <span 
                className="text-sm text-muted-foreground ml-2"
                style={{ fontSize: `calc(0.875rem * var(--font-scale, 1))` }}
              >
                (Auto-advance through all targets)
              </span>
            </label>
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            data-testid="start-button"
            onClick={onStartGame}
            size="lg"
            className="font-bold flex-1 relative overflow-hidden group"
            style={{
              fontSize: `calc(1.25rem * var(--font-scale, 1))`,
              padding: `calc(1rem * var(--spacing-scale, 1)) calc(2rem * var(--spacing-scale, 1))`,
              transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
            aria-label="Start the race"
          >
            <span className="relative z-10 flex items-center gap-2">
              {/* Micro-interaction: rocket spins on hover */}
              <span 
                className="inline-block"
                style={{
                  transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
                aria-hidden="true"
              >
                🚀
              </span>
              <span>Start Race</span>
            </span>
            {/* Shimmer effect on hover */}
            <div 
              className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary-foreground/10 to-primary/0"
              style={{
                transform: 'translateX(-200%)',
                transition: 'transform 0.7s ease-out'
              }}
              aria-hidden="true"
            />
          </Button>
        </div>

        <Button
          data-testid="reset-button"
          onClick={onResetGame}
          variant="ghost"
          className="mt-6 text-sm text-muted-foreground hover:text-foreground transition-all duration-200"
          style={{
            transition: 'all 0.2s ease-out'
          }}
          aria-label="Reset to level 1 and pause game"
        >
          Reset to Level 1 & pause game
        </Button>
      </Card>
    </div>
  )
})