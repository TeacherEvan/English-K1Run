import { memo, useEffect } from 'react'
import { CoinAnimation } from './CoinAnimation'

export interface Achievement {
  id: number
  type: 'correct' | 'worm'
  message: string
  emoji?: string
  x: number // percentage 0-100
  y: number // pixels
  playerSide: 'left' | 'right'
}

interface AchievementDisplayProps {
  achievement: Achievement
  onDismiss: () => void
}

// Positive messages for correct taps
export const CORRECT_MESSAGES = [
  { message: 'Perfect!', emoji: '⭐' },
  { message: 'Great Job!', emoji: '✨' },
  { message: 'Awesome!', emoji: '🌟' },
  { message: 'Excellent!', emoji: '💫' },
  { message: 'Super!', emoji: '🎉' },
  { message: 'Amazing!', emoji: '🎊' },
  { message: 'Fantastic!', emoji: '🌈' },
  { message: 'Wonderful!', emoji: '💖' },
  { message: 'Brilliant!', emoji: '✨' },
  { message: 'You did it!', emoji: '🏆' }
]

// Fun messages for worm taps
export const WORM_MESSAGES = [
  { message: 'Got one!', emoji: '🐛' },
  { message: 'Nice catch!', emoji: '👍' },
  { message: 'Squish!', emoji: '💥' },
  { message: 'Gotcha!', emoji: '🎯' },
  { message: 'Wiggle wiggle!', emoji: '🐛' },
  { message: 'Worm away!', emoji: '✨' },
  { message: 'Bye bye worm!', emoji: '👋' },
  { message: 'Caught it!', emoji: '🎉' }
]

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
