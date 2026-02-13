import { memo, useEffect, useRef, useState } from 'react'
import { UI_LAYER_MATRIX } from '../lib/constants/ui-layer-matrix'
import { Card } from './ui/card'

interface StopwatchProps {
    isRunning: boolean
    bestTime: number
    onRunComplete?: (time: number) => void
}

/**
 * Stopwatch - Digital timer for Continuous Mode
 * 
 * Displays:
 * 1. Best Time (Gold, pulsating)
 * 2. Current Time (Red, pulsating when active)
 * 
 * Dimensions: Compact 1x3 layout in top corner
 * 
 * Performance Note: onRunComplete should be memoized with useCallback in the parent
 * to prevent unnecessary re-renders. This component calls the callback only once per
 * timer session (when stopping or unmounting).
 */
export const Stopwatch = memo(({ isRunning, bestTime, onRunComplete }: StopwatchProps) => {
    const [currentTime, setCurrentTime] = useState(0)
    const timeRef = useRef(0)
    const reportedRef = useRef(false)

    // Keep a ref to avoid stale closures in cleanup.
    useEffect(() => {
        timeRef.current = currentTime
    }, [currentTime])

    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | undefined

        if (isRunning) {
            // Reset reported flag when timer starts
            reportedRef.current = false
            interval = setInterval(() => {
                setCurrentTime(prev => prev + 100)
            }, 100)
        } else if (!reportedRef.current && timeRef.current > 0) {
            // Report final time only once when stopping
            reportedRef.current = true
            onRunComplete?.(timeRef.current)
        }

        return () => {
            if (interval) {
                clearInterval(interval)
            }
            // If unmounting while running, report final time to ensure callback fires
            if (!reportedRef.current && timeRef.current > 0) {
                reportedRef.current = true
                onRunComplete?.(timeRef.current)
            }
        }
    }, [isRunning, onRunComplete])

    const formatTime = (ms: number) => {
        const minutes = Math.floor(ms / 60000)
        const seconds = Math.floor((ms % 60000) / 1000)
        const tenths = Math.floor((ms % 1000) / 100)
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${tenths}`
    }

    return (
        <div
            className="fixed top-4 right-4 flex flex-col gap-2 pointer-events-none"
            style={{ zIndex: UI_LAYER_MATRIX.HUD_SECONDARY }}
            data-testid="continuous-mode-stopwatch"
        >
            <Card className="bg-black/80 backdrop-blur border-2 border-yellow-500/50 p-3 rounded-xl shadow-2xl">
                <div className="flex flex-col gap-1 min-w-30">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] uppercase tracking-wider text-yellow-500/80 font-bold">
                            Best Time
                        </span>
                        <span
                            className="text-xl font-mono font-bold text-yellow-400 animate-pulse"
                            style={{ textShadow: '0 0 10px rgba(234, 179, 8, 0.5)' }}
                        >
                            {formatTime(bestTime)}
                        </span>
                    </div>

                    <div className="h-px w-full bg-white/10 my-1" />

                    <div className="flex flex-col items-end">
                        <span className="text-[10px] uppercase tracking-wider text-red-500/80 font-bold">
                            Current
                        </span>
                        <span
                            className={`text-xl font-mono font-bold text-red-500 ${isRunning ? 'animate-pulse' : ''}`}
                            style={{ textShadow: '0 0 10px rgba(239, 68, 68, 0.5)' }}
                        >
                            {formatTime(currentTime)}
                        </span>
                    </div>
                </div>
            </Card>
        </div>
    )
})

Stopwatch.displayName = 'Stopwatch'
