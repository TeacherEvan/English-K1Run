import { memo } from 'react'
import { UI_LAYER_MATRIX } from '../lib/constants/ui-layer-matrix'
import { Card } from './ui/card'

/**
 * Props for the PlayerArea component
 */
interface PlayerAreaProps {
  /** Player identifier (1 or 2 for future two-player mode) */
  playerNumber: 1 | 2
  /** Current progress percentage (0-100) */
  progress: number
  /** Child elements (falling objects, worms, effects) */
  children: React.ReactNode
  /** Whether this player has won the game */
  isWinner: boolean
}

/**
 * PlayerArea - Main game play area with progress tracking
 * 
 * Renders the interactive game surface where objects fall and players interact.
 * Handles victory state overlay and progress telemetry hooks.
 * 
 * Features:
 * - Full-screen game area with gradient background
 * - Victory celebration overlay with trophy emoji
 * - Progress tracking for test automation
 * - Optimized for tablet touch interaction
 * 
 * Architecture:
 * - Uses absolute positioning for falling objects
 * - Progress bar hidden but retained for E2E test hooks
 * - Victory overlay uses z-index layering
 * 
 * @component
 * @example
 * ```tsx
 * <PlayerArea
 *   playerNumber={1}
 *   progress={65}
 *   isWinner={false}
 * >
 *   {gameObjects.map(obj => <FallingObject key={obj.id} object={obj} />)}
 * </PlayerArea>
 * ```
 */
export const PlayerArea = memo(({
  playerNumber,
  progress,
  children,
  isWinner
}: PlayerAreaProps) => {
  // Clamp progress to valid range (0-100) for safety
  const normalizedProgress = Math.max(0, Math.min(progress, 100))

  return (
    <Card
      data-testid={`player-area-${playerNumber}`}
      className="relative h-full border-0 game-area overflow-hidden"
      role="main"
      aria-label={`Player ${playerNumber} game area`}
    >
      {/* 
        Hidden progress indicator retained for telemetry & E2E test hooks
        Not displayed visually, but provides programmatic access to progress state
      */}
      <div
        data-testid="progress-bar"
        data-progress={normalizedProgress}
        aria-hidden="true"
        aria-valuenow={normalizedProgress}
        aria-valuemin={0}
        aria-valuemax={100}
        role="progressbar"
        style={{
          width: `${normalizedProgress}%`,
          display: 'none'
        }}
      />

      {/* 
        Primary Game Area
        Contains all interactive game elements (falling objects, worms, effects)
        Top padding (pt-24) reserves space for target display
      */}
      <div
        data-testid="game-area"
        className="absolute inset-0 pt-24"
        aria-live="polite"
        aria-atomic="false"
      >
        {children}
      </div>

      {/* 
        Victory Celebration Overlay
        Displayed when player reaches 100% progress
        Blocks interaction with game elements underneath
      */}
      {isWinner && (
        <div
          className="absolute inset-0 bg-success/20 flex items-center justify-center"
          style={{ zIndex: UI_LAYER_MATRIX.GAMEPLAY_OVERLAY }}
          role="alert"
          aria-live="assertive"
        >
          <div className="text-center bounce-in">
            <div
              className="text-8xl mb-4"
              role="img"
              aria-label="Trophy"
            >
              🏆
            </div>
            <div className="text-primary text-3xl font-bold drop-shadow-lg">
              You Win!
            </div>
          </div>
        </div>
      )}
    </Card>
  )
})
