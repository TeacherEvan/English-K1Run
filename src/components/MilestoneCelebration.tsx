import { memo, useEffect, useState } from 'react'
import type { Milestone } from '../lib/constants/engagement-system'
import { cn } from '../lib/utils'

interface MilestoneCelebrationProps {
    milestone: Milestone
    onDismiss: () => void
}

/**
 * MilestoneCelebration - Full-screen celebration for progress milestones
 * 
 * Displays when player reaches 25%, 50%, 75%, 100% progress.
 * Creates memorable moments that heighten emotional engagement.
 * 
 * Features:
 * - Scale-in animation for impact
 * - Pulsing glow effect
 * - Auto-dismiss after duration
 * - Non-blocking (pointer-events-none after fade)
 * 
 * @component
 */
export const MilestoneCelebration = memo(({ milestone, onDismiss }: MilestoneCelebrationProps) => {
    const [isVisible, setIsVisible] = useState(true)
    const [isFading, setIsFading] = useState(false)

    useEffect(() => {
        // Start fade out before dismissal
        const fadeTimer = window.setTimeout(() => {
            setIsFading(true)
        }, milestone.duration - 500)

        // Dismiss after full duration
        const dismissTimer = window.setTimeout(() => {
            setIsVisible(false)
            onDismiss()
        }, milestone.duration)

        return () => {
            window.clearTimeout(fadeTimer)
            window.clearTimeout(dismissTimer)
        }
    }, [milestone.duration, onDismiss])

    if (!isVisible) return null

    // Color schemes based on milestone progress
    const getGradient = () => {
        switch (milestone.progress) {
            case 25:
                return 'from-green-400/90 via-emerald-500/80 to-teal-500/90'
            case 50:
                return 'from-blue-400/90 via-indigo-500/80 to-purple-500/90'
            case 75:
                return 'from-orange-400/90 via-amber-500/80 to-yellow-500/90'
            case 100:
                return 'from-pink-400/90 via-rose-500/80 to-red-500/90'
            default:
                return 'from-primary/90 via-primary/80 to-secondary/90'
        }
    }

    // Effect-specific decorations
    const renderEffect = () => {
        switch (milestone.effect) {
            case 'confetti':
                return (
                    <>
                        <span className="absolute top-10 left-1/4 text-4xl animate-bounce" style={{ animationDelay: '0ms' }}>🎊</span>
                        <span className="absolute top-20 right-1/4 text-3xl animate-bounce" style={{ animationDelay: '200ms' }}>🎉</span>
                        <span className="absolute bottom-20 left-1/3 text-4xl animate-bounce" style={{ animationDelay: '400ms' }}>🎊</span>
                        <span className="absolute bottom-16 right-1/3 text-3xl animate-bounce" style={{ animationDelay: '100ms' }}>🎉</span>
                    </>
                )
            case 'stars':
                return (
                    <>
                        <span className="absolute top-16 left-1/5 text-4xl animate-pulse">⭐</span>
                        <span className="absolute top-24 right-1/5 text-5xl animate-pulse" style={{ animationDelay: '300ms' }}>✨</span>
                        <span className="absolute bottom-24 left-1/4 text-4xl animate-pulse" style={{ animationDelay: '150ms' }}>🌟</span>
                        <span className="absolute bottom-20 right-1/4 text-3xl animate-pulse" style={{ animationDelay: '450ms' }}>💫</span>
                    </>
                )
            case 'rainbow':
                return (
                    <>
                        <span className="absolute top-12 left-1/2 -translate-x-1/2 text-6xl animate-pulse">🌈</span>
                        <span className="absolute bottom-16 left-1/3 text-4xl animate-bounce">⚡</span>
                        <span className="absolute bottom-16 right-1/3 text-4xl animate-bounce" style={{ animationDelay: '200ms' }}>💥</span>
                    </>
                )
            case 'firework':
                return (
                    <>
                        <span className="absolute top-8 left-1/4 text-5xl animate-ping" style={{ animationDuration: '1.5s' }}>🎆</span>
                        <span className="absolute top-12 right-1/4 text-5xl animate-ping" style={{ animationDuration: '1.8s', animationDelay: '300ms' }}>🎇</span>
                        <span className="absolute bottom-20 left-1/2 -translate-x-1/2 text-6xl animate-bounce">🏆</span>
                    </>
                )
            default:
                return null
        }
    }

    return (
        <div
            className={cn(
                'fixed inset-0 z-50 flex items-center justify-center pointer-events-none',
                'transition-opacity duration-500',
                isFading ? 'opacity-0' : 'opacity-100'
            )}
            aria-live="assertive"
            role="alert"
        >
            {/* Background overlay */}
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

            {/* Celebration content */}
            <div className="relative">
                {/* Decorative effects */}
                {renderEffect()}

                {/* Main celebration card */}
                <div
                    className={cn(
                        'relative rounded-3xl border-4 border-white/40 px-12 py-10 shadow-2xl',
                        'text-white text-center',
                        'animate-in zoom-in-75 duration-500',
                        `bg-gradient-to-br ${getGradient()}`
                    )}
                    style={{
                        boxShadow: '0 0 60px rgba(255, 255, 255, 0.3), 0 0 100px rgba(255, 255, 255, 0.1)'
                    }}
                >
                    {/* Pulsing glow ring */}
                    <div className="absolute inset-0 rounded-3xl animate-pulse opacity-50"
                        style={{
                            boxShadow: '0 0 40px 10px rgba(255, 255, 255, 0.4)'
                        }}
                    />

                    {/* Emoji */}
                    <div className="text-8xl mb-4 drop-shadow-lg animate-bounce">
                        {milestone.emoji}
                    </div>

                    {/* Progress indicator */}
                    <div className="text-lg font-bold uppercase tracking-widest mb-2 text-white/80">
                        {milestone.progress}% Complete
                    </div>

                    {/* Title */}
                    <div className="text-4xl font-black mb-3 drop-shadow-lg tracking-wide">
                        {milestone.title}
                    </div>

                    {/* Message */}
                    <div className="text-xl font-semibold text-white/90">
                        {milestone.message}
                    </div>
                </div>
            </div>
        </div>
    )
})

MilestoneCelebration.displayName = 'MilestoneCelebration'
