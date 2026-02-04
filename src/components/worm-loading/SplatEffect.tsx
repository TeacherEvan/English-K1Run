/**
 * Splat effect component for eliminated worms
 */

import { memo } from 'react'
import { WORM_SIZE } from './constants'
import type { Splat } from './types'

interface SplatEffectProps {
    splat: Splat
    currentTime: number
    duration: number
}

/**
 * Renders a fading splat effect at worm elimination position
 * Memoized for performance optimization
 */
export const SplatEffect = memo(({ splat, currentTime, duration }: SplatEffectProps) => {
    const age = currentTime - splat.createdAt
    const opacity = Math.max(0, 1 - age / duration)

    return (
        <div
            className="absolute pointer-events-none select-none"
            style={{
                left: `${splat.x}%`,
                top: `${splat.y}%`,
                fontSize: `${WORM_SIZE}px`,
                transform: 'translate(-50%, -50%)',
                opacity,
                transition: 'opacity 1s ease-out',
                zIndex: 5
            }}
        >
            💥
        </div>
    )
})

SplatEffect.displayName = 'SplatEffect'
