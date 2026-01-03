import { memo, useEffect } from 'react'
import type { ComboCelebration as ComboCelebrationData } from '../hooks/use-game-logic'
import type { ComboLevel } from '../lib/constants/combo-levels'
import { cn } from '../lib/utils'

interface ComboCelebrationProps {
    celebration: ComboCelebrationData & { emoji?: string; specialEffect?: ComboLevel['specialEffect'] }
    onDismiss: () => void
}

/**
 * ComboCelebration - Enhanced streak celebration with special effects
 * 
 * Features upgraded visual effects based on combo level:
 * - Sparkle: Gentle sparkle animation
 * - Rainbow: Colorful gradient background
 * - Firework: Explosive ping animations
 * - Golden: Premium gold styling
 */
export const ComboCelebration = memo(({ celebration, onDismiss }: ComboCelebrationProps) => {
    useEffect(() => {
        // Longer display for higher streaks
        const duration = celebration.streak >= 10 ? 3000 : 2000
        const timer = window.setTimeout(onDismiss, duration)
        return () => window.clearTimeout(timer)
    }, [celebration.id, celebration.streak, onDismiss])

    // Dynamic gradient based on special effect
    const getGradient = () => {
        switch (celebration.specialEffect) {
            case 'golden':
                return 'from-yellow-400/90 via-amber-500/85 to-orange-500/90'
            case 'firework':
                return 'from-red-400/85 via-pink-500/80 to-purple-500/85'
            case 'rainbow':
                return 'from-violet-400/80 via-blue-400/75 to-cyan-400/80'
            case 'sparkle':
            default:
                return 'from-primary/80 via-primary/65 to-amber-200/70'
        }
    }

    // Render special effect decorations
    const renderEffectDecorations = () => {
        const effect = celebration.specialEffect || 'sparkle'

        switch (effect) {
            case 'golden':
                return (
                    <>
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-4xl animate-bounce">👑</span>
                        <div className="absolute inset-0 rounded-2xl animate-pulse opacity-40"
                            style={{ boxShadow: '0 0 30px 8px rgba(255, 215, 0, 0.6)' }}
                        />
                    </>
                )
            case 'firework':
                return (
                    <>
                        <span className="absolute -top-6 left-4 text-3xl animate-ping" style={{ animationDuration: '1s' }}>💥</span>
                        <span className="absolute -top-4 right-6 text-2xl animate-ping" style={{ animationDuration: '1.2s', animationDelay: '200ms' }}>🎆</span>
                        <span className="absolute -bottom-4 left-1/2 text-3xl animate-bounce">🔥</span>
                    </>
                )
            case 'rainbow':
                return (
                    <>
                        <span className="absolute -top-5 right-8 text-3xl animate-pulse">🌈</span>
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-2xl animate-bounce">⚡</span>
                    </>
                )
            case 'sparkle':
            default:
                return (
                    <>
                        <span className="absolute left-4 top-2 h-2.5 w-2.5 rounded-full bg-white/80 animate-ping" />
                        <span className="absolute right-6 bottom-3 h-2 w-2 rounded-full bg-yellow-200/80 animate-ping" style={{ animationDelay: '150ms' }} />
                        <div className="absolute -top-5 right-8 text-3xl drop-shadow-lg" style={{ opacity: 0.9 }}>✨</div>
                    </>
                )
        }
    }

    // Center alignment for single player
    const alignment = 'left-1/2 -translate-x-1/2'

    return (
        <div className={cn('absolute top-28 z-40 pointer-events-none', alignment)}>
            <div className={cn(
                'relative overflow-hidden rounded-2xl border px-6 py-5 shadow-xl backdrop-blur-sm text-white/95 bounce-in',
                `bg-gradient-to-br ${getGradient()}`,
                celebration.specialEffect === 'golden' ? 'border-yellow-300/60' : 'border-white/30'
            )}>
                {/* Background glow */}
                <div className="absolute -top-8 -left-3 h-20 w-20 rounded-full bg-white/15 blur-2xl" />

                {/* Special effect decorations */}
                {renderEffectDecorations()}

                <div className="relative">
                    {/* Streak count with multiplier hint */}
                    <div className="text-xs font-semibold uppercase tracking-wide text-white/75 flex items-center gap-2">
                        <span>{celebration.streak} in a row</span>
                        {celebration.streak >= 10 && (
                            <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px]">
                                {celebration.streak >= 20 ? '3x' : celebration.streak >= 15 ? '2.5x' : '2x'} Points!
                            </span>
                        )}
                    </div>

                    {/* Title with emoji */}
                    <div className="mt-1 text-xl font-bold drop-shadow-md flex items-center gap-2">
                        {celebration.emoji && <span className="text-2xl">{celebration.emoji}</span>}
                        {celebration.title}
                    </div>

                    {/* Description */}
                    <div className="mt-1.5 text-sm font-medium text-white/85">
                        {celebration.description}
                    </div>
                </div>
            </div>
        </div>
    )
})

ComboCelebration.displayName = 'ComboCelebration'