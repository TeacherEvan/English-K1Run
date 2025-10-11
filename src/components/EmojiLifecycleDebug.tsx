import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { EmojiLifecycleEvent } from '@/lib/event-tracker'
import { eventTracker } from '@/lib/event-tracker'
import { memo, useEffect, useState } from 'react'

interface EmojiLifecycleInfo {
    objectId: string
    emoji: string
    name: string
    spawnTime: number
    phases: Array<{
        phase: string
        timestamp: number
        duration: number
        position?: { x: number; y: number }
        playerSide?: string
        data?: unknown
    }>
    totalDuration: number
    wasCompleted: boolean
}

export const EmojiLifecycleDebug = memo(() => {
    const [lifecycles, setLifecycles] = useState<EmojiLifecycleInfo[]>([])
    const [isEnabled, setIsEnabled] = useState(false)
    const [isVisible, setIsVisible] = useState(true)
    const [autoRefresh, setAutoRefresh] = useState(true)

    const updateLifecycles = () => {
        const stats = eventTracker.getLifecycleStats()
        setIsEnabled(stats.isEnabled)

        const lifecycleData: EmojiLifecycleInfo[] = []
        const allLifecycles = eventTracker.getAllEmojiLifecycles()

        allLifecycles.forEach((events: EmojiLifecycleEvent[], objectId: string) => {
            if (events.length === 0) return

            const firstEvent = events[0]
            const lastEvent = events[events.length - 1]

            lifecycleData.push({
                objectId,
                emoji: firstEvent.emoji,
                name: firstEvent.name,
                spawnTime: firstEvent.timestamp,
                phases: events.map(e => ({
                    phase: e.phase,
                    timestamp: e.timestamp,
                    duration: e.duration || 0,
                    position: e.position,
                    playerSide: e.playerSide,
                    data: e.data
                })),
                totalDuration: lastEvent.timestamp - firstEvent.timestamp,
                wasCompleted: events.some(e => e.phase === 'tapped' || e.phase === 'removed' || e.phase === 'missed')
            })
        })

        // Sort by spawn time
        lifecycleData.sort((a, b) => a.spawnTime - b.spawnTime)
        setLifecycles(lifecycleData)
    }

    useEffect(() => {
        if (autoRefresh) {
            // Use setTimeout to avoid synchronous setState in effect
            const timeout = setTimeout(() => updateLifecycles(), 0)
            const interval = setInterval(updateLifecycles, 500)
            return () => {
                clearTimeout(timeout)
                clearInterval(interval)
            }
        }
    }, [autoRefresh])

    const toggleTracking = () => {
        const newState = !isEnabled
        eventTracker.enableLifecycleTracking(newState)
        if (newState) {
            eventTracker.clearLifecycleTracking()
            setLifecycles([])
        }
        setIsEnabled(newState)
        updateLifecycles()
    }

    const clearTracking = () => {
        eventTracker.clearLifecycleTracking()
        setLifecycles([])
        updateLifecycles()
    }

    const copyToClipboard = async () => {
        const stats = eventTracker.getLifecycleStats()
        const data = {
            timestamp: new Date().toISOString(),
            screenInfo: {
                width: window.innerWidth,
                height: window.innerHeight,
                devicePixelRatio: window.devicePixelRatio
            },
            trackingEnabled: isEnabled,
            stats,
            lifecycles: lifecycles.map(lc => ({
                objectId: lc.objectId,
                emoji: lc.emoji,
                name: lc.name,
                spawnTime: lc.spawnTime,
                totalDuration: lc.totalDuration,
                wasCompleted: lc.wasCompleted,
                phases: lc.phases
            }))
        }

        try {
            await navigator.clipboard.writeText(JSON.stringify(data, null, 2))
            alert('✓ Lifecycle data copied to clipboard!')
        } catch (err) {
            console.error('Failed to copy:', err)
            // Fallback: create a text area
            const textarea = document.createElement('textarea')
            textarea.value = JSON.stringify(data, null, 2)
            textarea.style.position = 'fixed'
            textarea.style.opacity = '0'
            document.body.appendChild(textarea)
            textarea.select()
            document.execCommand('copy')
            document.body.removeChild(textarea)
            alert('✓ Lifecycle data copied to clipboard (fallback method)')
        }
    }

    const getPhaseColor = (phase: string): string => {
        switch (phase) {
            case 'spawned': return 'bg-blue-500'
            case 'rendered': return 'bg-cyan-500'
            case 'visible': return 'bg-green-500'
            case 'tapped': return 'bg-yellow-500'
            case 'removed': return 'bg-gray-500'
            case 'missed': return 'bg-red-500'
            default: return 'bg-purple-500'
        }
    }

    const getPhaseIcon = (phase: string): string => {
        switch (phase) {
            case 'spawned': return '🌱'
            case 'rendered': return '🎨'
            case 'visible': return '👁️'
            case 'tapped': return '👆'
            case 'removed': return '🗑️'
            case 'missed': return '❌'
            default: return '❓'
        }
    }

    if (!isVisible) {
        return (
            <div className="fixed bottom-4 left-4 z-50">
                <Button
                    onClick={() => setIsVisible(true)}
                    variant="outline"
                    size="sm"
                    className="bg-purple-500/90 text-white hover:bg-purple-600"
                >
                    📊 Emoji Lifecycle
                </Button>
            </div>
        )
    }

    return (
        <Card className="fixed bottom-4 left-4 z-50 w-[700px] max-h-[700px] bg-black/90 text-white border-purple-500 overflow-hidden">
            <CardHeader className="pb-3 border-b border-purple-500/30">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        📊 Emoji Lifecycle Tracker
                        <Badge variant={isEnabled ? "default" : "secondary"} className="ml-2">
                            {isEnabled ? '🟢 Recording' : '🔴 Stopped'}
                        </Badge>
                    </CardTitle>
                    <div className="flex gap-2">
                        <Button
                            onClick={() => setAutoRefresh(!autoRefresh)}
                            variant="outline"
                            size="sm"
                            className={autoRefresh ? 'bg-green-500/20' : 'bg-gray-500/20'}
                        >
                            {autoRefresh ? '⏸️' : '▶️'}
                        </Button>
                        <Button onClick={() => setIsVisible(false)} variant="ghost" size="sm">
                            ➖
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-4 overflow-y-auto max-h-[600px]">
                <div className="flex gap-2 mb-4">
                    <Button
                        onClick={toggleTracking}
                        variant={isEnabled ? "destructive" : "default"}
                        size="sm"
                        className="flex-1"
                    >
                        {isEnabled ? '⏹️ Stop Tracking' : '▶️ Start Tracking'}
                    </Button>
                    <Button onClick={clearTracking} variant="outline" size="sm" className="flex-1">
                        🗑️ Clear
                    </Button>
                    <Button onClick={copyToClipboard} variant="outline" size="sm" title="Copy all data to clipboard">
                        📋 Copy
                    </Button>
                    <Button onClick={updateLifecycles} variant="outline" size="sm">
                        🔄
                    </Button>
                </div>

                {!isEnabled && lifecycles.length === 0 && (
                    <div className="text-center text-gray-400 py-8">
                        <p className="text-4xl mb-2">🎯</p>
                        <p>Click "Start Tracking" to monitor emoji lifecycles</p>
                        <p className="text-sm mt-2">Will track the first 10 emojis spawned</p>
                    </div>
                )}

                {lifecycles.length > 0 && (
                    <div className="space-y-4">
                        <div className="text-sm text-gray-400 mb-2">
                            Tracking {lifecycles.length} emojis
                        </div>

                        {lifecycles.map((lifecycle, idx) => (
                            <div
                                key={lifecycle.objectId}
                                className="border border-purple-500/30 rounded-lg p-3 bg-purple-900/10"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-xs">
                                            #{idx + 1}
                                        </Badge>
                                        <span className="text-2xl">{lifecycle.emoji}</span>
                                        <span className="font-semibold">{lifecycle.name}</span>
                                        {lifecycle.wasCompleted ? (
                                            <Badge className="bg-green-500">✓ Completed</Badge>
                                        ) : (
                                            <Badge variant="secondary">⏳ Active</Badge>
                                        )}
                                    </div>
                                    <div className="text-xs text-gray-400">
                                        {lifecycle.totalDuration}ms total
                                    </div>
                                </div>

                                <div className="text-xs text-gray-400 mb-2">
                                    ID: {lifecycle.objectId.substring(0, 12)}...
                                </div>

                                <div className="space-y-1">
                                    {lifecycle.phases.map((phase, phaseIdx) => (
                                        <div
                                            key={phaseIdx}
                                            className="flex flex-col gap-1 text-xs py-1 px-2 rounded bg-black/30"
                                        >
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span>{getPhaseIcon(phase.phase)}</span>
                                                <Badge className={`${getPhaseColor(phase.phase)} text-white text-xs`}>
                                                    {phase.phase}
                                                </Badge>
                                                <span className="text-gray-400">+{phase.duration}ms</span>
                                                {phase.position && (
                                                    <span className="text-gray-500 font-mono">
                                                        X:{phase.position.x.toFixed(0)} Y:{phase.position.y.toFixed(0)}
                                                    </span>
                                                )}
                                                {phase.playerSide && (
                                                    <Badge variant="outline" className="text-xs">
                                                        {phase.playerSide}
                                                    </Badge>
                                                )}
                                            </div>
                                            {phase.data !== undefined && (
                                                <div className="text-gray-500 text-xs ml-6 font-mono break-all">
                                                    {(() => {
                                                        if (typeof phase.data === 'object' && phase.data !== null) {
                                                            return JSON.stringify(phase.data, null, 2)
                                                        }
                                                        return String(phase.data)
                                                    })()}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {isEnabled && lifecycles.length === 0 && (
                    <div className="text-center text-yellow-400 py-8">
                        <p className="text-4xl mb-2">⏳</p>
                        <p>Waiting for emojis to spawn...</p>
                        <p className="text-sm mt-2 text-gray-400">Start the game to begin tracking</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
})

EmojiLifecycleDebug.displayName = 'EmojiLifecycleDebug'
