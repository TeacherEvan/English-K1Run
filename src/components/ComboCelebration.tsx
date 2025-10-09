import { memo, useEffect } from 'react'
import type { ComboCelebration as ComboCelebrationData } from '../hooks/use-game-logic'
import { cn } from '../lib/utils'

interface ComboCelebrationProps {
    celebration: ComboCelebrationData
    onDismiss: () => void
}

export const ComboCelebration = memo(({ celebration, onDismiss }: ComboCelebrationProps) => {
    useEffect(() => {
        const timer = window.setTimeout(onDismiss, 2000) // Reduced from 2400ms to 2000ms
        return () => window.clearTimeout(timer)
    }, [celebration.id, onDismiss])

    const alignment = celebration.player === 1 ? 'left-4 sm:left-12' : 'right-4 sm:right-12'
    const gradient = celebration.player === 1
        ? 'from-primary/80 via-primary/65 to-amber-200/70' // Reduced opacity
        : 'from-secondary/80 via-secondary/60 to-sky-200/70'

    return (
        <div className={cn('absolute top-28 z-40 pointer-events-none', alignment)}>
            <div className={cn('relative overflow-hidden rounded-2xl border border-white/30 px-5 py-4 shadow-xl backdrop-blur-sm text-white/95 bounce-in', `bg-gradient-to-br ${gradient}`)}>
                {/* Simplified background effects - removed extra blur elements */}
                <div className="absolute -top-8 -left-3 h-20 w-20 rounded-full bg-white/15 blur-2xl" />
                
                {/* Reduced sparkles from 3 to 2 */}
                <span className="absolute left-4 top-2 h-2.5 w-2.5 rounded-full bg-white/80 animate-ping" />
                <span className="absolute right-6 bottom-3 h-2 w-2 rounded-full bg-yellow-200/80 animate-ping" style={{ animationDelay: '150ms' }} />
                
                {/* Single emoji decoration */}
                <div className="absolute -top-5 right-8 text-3xl drop-shadow-lg" style={{ opacity: 0.9 }}>✨</div>

                <div className="relative">
                    <div className="text-xs font-semibold uppercase tracking-wide text-white/75">
                        {celebration.streak} in a row
                    </div>
                    <div className="mt-1 text-xl font-bold drop-shadow-md">
                        {celebration.title}
                    </div>
                    <div className="mt-1.5 text-sm font-medium text-white/85">
                        {celebration.description}
                    </div>
                </div>
            </div>
        </div>
    )
})
