/**
 * WormLoadingScreen - Interactive loading screen with animated worms.
 */

import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { UI_LAYER_MATRIX } from '../../lib/constants/ui-layer-matrix'
import '../WormLoadingScreen.css'
import {
    COMPLETION_DELAY,
    SPEED_INCREASE_FACTOR,
    SPLAT_DURATION
} from './constants'
import { SplatEffect } from './SplatEffect'
import type { Splat, Worm, WormLoadingScreenProps } from './types'
import { useWormAnimation } from './use-worm-animation'
import { createInitialWorms } from './worm-utils'
import { WormEntity } from './WormEntity'

export const WormLoadingScreen = memo(({ onComplete, autoCompleteAfterMs }: WormLoadingScreenProps) => {
    const [worms, setWorms] = useState<Worm[]>(createInitialWorms)
    const [splats, setSplats] = useState<Splat[]>([])
    const [speedMultiplier, setSpeedMultiplier] = useState(1)
    const [currentTime, setCurrentTime] = useState(() => Date.now())
    const [showCompletionMessage, setShowCompletionMessage] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const splatIdCounter = useRef(0)
    const completionTriggeredRef = useRef(false)
    const autoCompleteTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const hasInteractionRef = useRef(false)

    useWormAnimation({ setWorms, speedMultiplier, containerRef })

    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now()
            setCurrentTime(now)
            setSplats(prev => prev.filter(splat => now - splat.createdAt < SPLAT_DURATION))
        }, 1000)

        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        if (!autoCompleteAfterMs) return
        autoCompleteTimeoutRef.current = setTimeout(() => {
            if (!hasInteractionRef.current) {
                onComplete()
            }
        }, autoCompleteAfterMs)

        return () => {
            if (autoCompleteTimeoutRef.current) {
                clearTimeout(autoCompleteTimeoutRef.current)
                autoCompleteTimeoutRef.current = null
            }
        }
    }, [autoCompleteAfterMs, onComplete])

    const registerInteraction = useCallback(() => {
        if (hasInteractionRef.current) return
        hasInteractionRef.current = true
        if (autoCompleteTimeoutRef.current) {
            clearTimeout(autoCompleteTimeoutRef.current)
            autoCompleteTimeoutRef.current = null
        }
    }, [])

    const handleWormClick = useCallback((wormId: number, event: React.MouseEvent | React.TouchEvent) => {
        event.preventDefault()
        event.stopPropagation()
        registerInteraction()

        setWorms(prev => {
            // Early guard: validate worm exists and is alive
            const wormIndex = prev.findIndex(w => w.id === wormId)

            if (wormIndex === -1) {
                // Worm not found - already processed or invalid ID
                console.debug(`Worm ${wormId} not found in state`)
                return prev
            }

            const targetWorm = prev[wormIndex]
            if (!targetWorm.alive) {
                // Worm already dead - ignore duplicate clicks
                return prev
            }

            // Single-pass update using the found index
            const updatedWorms = [...prev]
            updatedWorms[wormIndex] = { ...targetWorm, alive: false }

            // Create splat at worm position (separate state update)
            requestAnimationFrame(() => {
                setSplats(prevSplats => [
                    ...prevSplats,
                    {
                        id: splatIdCounter.current++,
                        x: targetWorm.x,
                        y: targetWorm.y,
                        createdAt: Date.now()
                    }
                ])
            })

            // Increase speed for remaining worms or trigger completion
            const aliveCount = updatedWorms.filter(w => w.alive).length
            if (aliveCount > 0) {
                setSpeedMultiplier(prevSpeed => prevSpeed * SPEED_INCREASE_FACTOR)
            } else {
                if (completionTriggeredRef.current) return updatedWorms
                completionTriggeredRef.current = true
                setShowCompletionMessage(true)
                setTimeout(() => {
                    onComplete()
                }, COMPLETION_DELAY)
            }

            return updatedWorms
        })
    }, [onComplete, registerInteraction])

    const aliveWorms = worms.filter(w => w.alive)
    const completionVisible = showCompletionMessage || aliveWorms.length === 0

    return (
        <div
            data-testid="worm-loading-screen"
            ref={containerRef}
            className="fixed inset-0 bg-linear-to-br from-green-50 to-green-100 overflow-hidden"
            style={{ touchAction: 'none', zIndex: UI_LAYER_MATRIX.STARTUP_LOADING_OVERLAY }}
        >
            <div className="absolute top-8 left-1/2 transform -translate-x-1/2 text-center">
                <h2 className="text-3xl font-bold text-green-800 mb-2">
                    🐛 Catch the Worms! 🐛
                </h2>
                <p className="text-lg text-green-600">
                    {completionVisible
                        ? 'Great job! Getting ready...'
                        : aliveWorms.length > 0
                            ? `${aliveWorms.length} worm${aliveWorms.length !== 1 ? 's' : ''} remaining...`
                            : 'All worms caught! Starting game...'}
                </p>
            </div>

            {worms.map(worm => (
                <WormEntity key={worm.id} worm={worm} onWormClick={handleWormClick} />
            ))}

            {splats.map(splat => (
                <SplatEffect
                    key={splat.id}
                    splat={splat}
                    currentTime={currentTime}
                    duration={SPLAT_DURATION}
                />
            ))}

            {completionVisible && (
                <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 text-center">
                    <p
                        className="text-xl text-green-700 font-bold animate-pulse bg-white/80 px-6 py-3 rounded-lg shadow-lg"
                        data-testid="worm-completion-message"
                    >
                        🎯 All worms caught! Starting game...
                    </p>
                </div>
            )}

            <button
                data-testid="skip-loading-button"
                onClick={() => {
                    registerInteraction()
                    onComplete()
                }}
                className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg shadow-lg transition-all hover:scale-105"
                aria-label="Skip to game immediately without catching worms"
            >
                Skip to Game (or catch all worms!)
            </button>
        </div>
    )
})

WormLoadingScreen.displayName = 'WormLoadingScreen'
