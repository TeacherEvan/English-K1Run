import { memo, useEffect } from 'react'
import type { Achievement } from '../types/game'
import { CoinAnimation } from './CoinAnimation'

// Re-export for backward compatibility
export { CORRECT_MESSAGES, WORM_MESSAGES } from '../lib/constants/messages'
export type { Achievement } from '../types/game'

interface AchievementDisplayProps {
  achievement: Achievement
  onDismiss: () => void
}

export const AchievementDisplay = memo(({ achievement, onDismiss }: AchievementDisplayProps) => {
  useEffect(() => {
    // Auto-dismiss after 500ms to match animation duration
    // Note: Correct taps already play word pronunciation in use-game-logic
    // Worm taps don't need separate audio (visual feedback is sufficient)
    const timer = window.setTimeout(onDismiss, 500)
    return () => window.clearTimeout(timer)
  }, [achievement.id, onDismiss])

  // Use coin animation for both correct taps and worm taps
  return (
    <CoinAnimation
      id={achievement.id}
      x={achievement.x}
      y={achievement.y}
      playerSide={achievement.playerSide}
      onDismiss={onDismiss}
    />
  )
})

AchievementDisplay.displayName = 'AchievementDisplay'
