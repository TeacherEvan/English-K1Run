import { memo, useEffect } from 'react'
import { cn } from '../lib/utils'

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
const CORRECT_MESSAGES = [
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
const WORM_MESSAGES = [
  { message: 'Got one!', emoji: '🐛' },
  { message: 'Nice catch!', emoji: '👍' },
  { message: 'Squish!', emoji: '💥' },
  { message: 'Gotcha!', emoji: '🎯' },
  { message: 'Wiggle wiggle!', emoji: '🐛' },
  { message: 'Worm away!', emoji: '✨' },
  { message: 'Bye bye worm!', emoji: '👋' },
  { message: 'Caught it!', emoji: '🎉' }
]

export const getRandomCorrectMessage = () => {
  const index = Math.floor(Math.random() * CORRECT_MESSAGES.length)
  return CORRECT_MESSAGES[index]
}

export const getRandomWormMessage = () => {
  const index = Math.floor(Math.random() * WORM_MESSAGES.length)
  return WORM_MESSAGES[index]
}

export const AchievementDisplay = memo(({ achievement, onDismiss }: AchievementDisplayProps) => {
  useEffect(() => {
    // Auto-dismiss after 2 seconds for better visibility
    const timer = window.setTimeout(onDismiss, 2000)
    return () => window.clearTimeout(timer)
  }, [achievement.id, onDismiss])

  // Different styles for correct vs worm achievements
  const isCorrect = achievement.type === 'correct'
  const gradient = isCorrect
    ? 'from-yellow-400/90 via-amber-300/85 to-orange-400/90'
    : 'from-green-400/90 via-emerald-300/85 to-teal-400/90'
  
  const borderColor = isCorrect ? 'border-yellow-200/50' : 'border-green-200/50'
  const textShadow = isCorrect ? 'drop-shadow-[0_2px_4px_rgba(251,191,36,0.5)]' : 'drop-shadow-[0_2px_4px_rgba(52,211,153,0.5)]'

  return (
    <div
      className="absolute z-50 pointer-events-none"
      style={{
        left: `${achievement.x}%`,
        top: `${achievement.y}px`,
        transform: 'translate(-50%, -50%)'
      }}
    >
      <div className={cn(
        'relative rounded-xl border-2 px-4 py-2 shadow-2xl backdrop-blur-sm',
        'animate-bounce-scale',
        `bg-gradient-to-br ${gradient}`,
        borderColor
      )}>
        {/* Sparkle effects */}
        <div className="absolute -top-2 -left-2 h-3 w-3 rounded-full bg-white/90 animate-ping" />
        <div className="absolute -bottom-1 -right-1 h-2.5 w-2.5 rounded-full bg-white/80 animate-ping" style={{ animationDelay: '100ms' }} />
        <div className="absolute top-1/2 -left-3 h-2 w-2 rounded-full bg-yellow-200/90 animate-ping" style={{ animationDelay: '200ms' }} />
        
        {/* Achievement content */}
        <div className={cn('relative flex items-center gap-2', textShadow)}>
          {achievement.emoji && (
            <span className="text-2xl animate-spin-slow">{achievement.emoji}</span>
          )}
          <span className="text-lg font-bold text-white whitespace-nowrap">
            {achievement.message}
          </span>
        </div>
        
        {/* Shine effect */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shine" />
      </div>
    </div>
  )
})

AchievementDisplay.displayName = 'AchievementDisplay'
