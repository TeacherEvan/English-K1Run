/**
 * Multi-Touch Handler Debug Overlay
 * 
 * Displays real-time statistics from the multi-touch handler:
 * - Active touches count
 * - Recent taps tracking
 * - Configuration settings
 * - Touch validation metrics
 */

import { memo, useEffect, useState } from 'react'
import { multiTouchHandler } from '../lib/touch-handler'

export const TouchHandlerDebug = memo(() => {
    const [stats, setStats] = useState(() => multiTouchHandler.getStats())

    useEffect(() => {
        const interval = setInterval(() => {
            setStats(multiTouchHandler.getStats())
        }, 100) // Update 10 times per second

        return () => clearInterval(interval)
    }, [])

    if (!stats.enabled) {
        return (
            <div className="fixed bottom-4 left-4 bg-gray-900/90 text-white p-3 rounded-lg text-xs font-mono shadow-lg border border-gray-700 z-50">
                <div className="font-bold text-yellow-400 mb-1">🔴 Touch Handler: DISABLED</div>
                <div className="text-gray-400">Enable when gameplay starts</div>
            </div>
        )
    }

    return (
        <div className="fixed bottom-4 left-4 bg-gray-900/90 text-white p-3 rounded-lg text-xs font-mono shadow-lg border border-green-500 z-50 min-w-[280px]">
            <div className="font-bold text-green-400 mb-2">🟢 Multi-Touch Handler</div>

            <div className="space-y-1">
                <div className="flex justify-between items-center">
                    <span className="text-gray-400">Active Touches:</span>
                    <span className={`font-bold ${stats.activeTouches > 0 ? 'text-cyan-400' : 'text-gray-500'}`}>
                        {stats.activeTouches}
                    </span>
                </div>

                <div className="flex justify-between items-center">
                    <span className="text-gray-400">Recent Taps:</span>
                    <span className={`font-bold ${stats.recentTaps > 0 ? 'text-yellow-400' : 'text-gray-500'}`}>
                        {stats.recentTaps}
                    </span>
                </div>

                <div className="border-t border-gray-700 my-2"></div>

                <div className="text-gray-400 text-[10px] space-y-0.5">
                    <div>Debounce: {stats.options.debounceMs}ms</div>
                    <div>Tap Threshold: {stats.options.tapThresholdMs}ms</div>
                    <div>Movement Limit: {stats.options.movementThresholdPx}px</div>
                </div>
            </div>

            <div className="mt-2 pt-2 border-t border-gray-700">
                <div className="text-[10px] text-gray-500">
                    Prevents accidental touches & double-taps
                </div>
            </div>
        </div>
    )
})

TouchHandlerDebug.displayName = 'TouchHandlerDebug'
