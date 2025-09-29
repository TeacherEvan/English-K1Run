import { memo, useEffect } from 'react'
import type { ComboCelebration as ComboCelebrationData } from '../hooks/use-game-logic'
import { cn } from '../lib/utils'

interface ComboCelebrationProps {
    celebration: ComboCelebrationData
    onDismiss: () => void
}

export const ComboCelebration = memo(({ celebration, onDismiss }: ComboCelebrationProps) => {
    useEffect(() => {
        const timer = window.setTimeout(onDismiss, 2400)
        return () => window.clearTimeout(timer)
    }, [celebration.id, onDismiss])

    const alignment = celebration.player === 1 ? 'left-4 sm:left-12' : 'right-4 sm:right-12'
    const gradient = celebration.player === 1
        ? 'from-primary/90 via-primary/75 to-amber-200/80'
        : 'from-secondary/90 via-secondary/70 to-sky-200/80'

    return (
        <div className={cn('absolute top-28 z-40 pointer-events-none', alignment)}>
            <div className={cn('relative overflow-hidden rounded-3xl border border-white/40 px-6 py-5 shadow-2xl backdrop-blur-md text-white/95 bounce-in', `bg-gradient-to-br ${gradient}`)}>
                <div className="absolute -top-10 -left-4 h-24 w-24 rounded-full bg-white/20 blur-3xl animate-pulse" />
                <div className="absolute -bottom-12 right-6 h-28 w-28 rounded-full bg-white/10 blur-3xl animate-pulse" style={{ animationDelay: '180ms' }} />

                <span className="absolute left-4 top-2 h-3 w-3 rounded-full bg-white/90 animate-ping" />
                <span className="absolute right-6 top-6 h-2.5 w-2.5 rounded-full bg-yellow-200 animate-ping" style={{ animationDelay: '120ms' }} />
                <span className="absolute left-16 bottom-4 h-2 w-2 rounded-full bg-white/80 animate-ping" style={{ animationDelay: '220ms' }} />
                <div className="absolute -top-6 right-8 text-4xl drop-shadow-lg animate-pulse" style={{ animationDuration: '1.5s' }}>✨</div>
                <div className="absolute -bottom-4 left-6 text-3xl drop-shadow-lg animate-bounce" style={{ animationDuration: '1.8s' }}>✨</div>

                <div className="relative">
                    <div className="text-xs font-semibold uppercase tracking-[0.35em] text-white/80">
                        {celebration.streak} in a row
                    </div>
                    <div className="mt-1 text-2xl font-extrabold drop-shadow-lg">
                        {celebration.title}
                    </div>
                    <div className="mt-2 text-sm font-medium text-white/90">
                        {celebration.description}
                    </div>
                </div>
            </div>
        </div>
    )
})
