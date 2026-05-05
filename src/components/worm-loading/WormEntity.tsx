/**
 * Individual worm entity component
 */

import { memo } from 'react'
import '../WormLoadingScreen.css'
import { WORM_SIZE } from './constants'
import type { Worm } from './types'

interface WormEntityProps {
    worm: Worm
    onWormClick: (
        wormId: number,
        event: React.MouseEvent | React.TouchEvent | React.KeyboardEvent,
    ) => void
}

/**
 * Renders a single animated worm with click/touch handling
 * Memoized for performance optimization
 */
export const WormEntity = memo(({ worm, onWormClick }: WormEntityProps) => {
    if (!worm.alive) return null

    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (event.key !== 'Enter' && event.key !== ' ') {
            return
        }

        event.preventDefault()
        onWormClick(worm.id, event)
    }

    return (
        <div
            className="absolute cursor-pointer select-none transition-opacity duration-200 hover:scale-110"
            style={{
                left: `${worm.x}%`,
                top: `${worm.y}%`,
                fontSize: `${WORM_SIZE}px`,
                transform: `translate(-50%, -50%) rotate(${worm.angle}rad)`,
                zIndex: 10,
                // Explicit hit area for reliable test clicking
                width: `${WORM_SIZE * 1.2}px`,
                height: `${WORM_SIZE * 1.2}px`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}
            onClick={(e) => onWormClick(worm.id, e)}
            onTouchEnd={(e) => {
                e.preventDefault()
                onWormClick(worm.id, e)
            }}
            onKeyDown={handleKeyDown}
            data-testid="worm-target"
            role="button"
            aria-label="Tap worm"
            tabIndex={0}
        >
            <div className="worm-wiggle">
                🐛
            </div>
        </div>
    )
})

WormEntity.displayName = 'WormEntity'
