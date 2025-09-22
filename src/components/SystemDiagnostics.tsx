/**
 * Comprehensive Error Detection and Diagnostic System
 * This component provides real-time error monitoring and system validation
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { eventTracker } from '../lib/event-tracker'
import { soundManager } from '../lib/sound-manager'

interface DiagnosticResult {
    category: string
    status: 'pass' | 'warning' | 'error'
    message: string
    details?: unknown
    timestamp: number
}

interface SystemHealth {
    overall: 'healthy' | 'warning' | 'critical'
    audio: boolean
    rendering: boolean
    performance: boolean
    imports: boolean
    errors: number
    warnings: number
}

interface PerformanceMemory {
    usedJSHeapSize: number
    totalJSHeapSize: number
    jsHeapSizeLimit: number
}

interface PerformanceWithMemory extends Performance {
    memory?: PerformanceMemory
}

export function SystemDiagnostics() {
    const [isVisible, setIsVisible] = useState(false)
    const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([])
    const [systemHealth, setSystemHealth] = useState<SystemHealth>({
        overall: 'healthy',
        audio: false,
        rendering: false,
        performance: false,
        imports: false,
        errors: 0,
        warnings: 0
    })
    const [isRunning, setIsRunning] = useState(false)
    const diagnosticsRef = useRef<DiagnosticResult[]>([])

    const addDiagnostic = useCallback((result: Omit<DiagnosticResult, 'timestamp'>) => {
        const diagnostic = { ...result, timestamp: Date.now() }
        diagnosticsRef.current.push(diagnostic)
        setDiagnostics([...diagnosticsRef.current])
    }, [])

    const runComprehensiveDiagnostics = useCallback(async () => {
        setIsRunning(true)
        diagnosticsRef.current = []

        try {
            // 1. Test Audio System
            addDiagnostic({
                category: 'Audio System',
                status: 'pass',
                message: 'Starting audio system tests...'
            })

            try {
                await soundManager.ensureInitialized()
                if (soundManager.isInitialized()) {
                    addDiagnostic({
                        category: 'Audio System',
                        status: 'pass',
                        message: 'Audio context initialized successfully'
                    })

                    // Test sound playback
                    await soundManager.playSound('tap')
                    addDiagnostic({
                        category: 'Audio System',
                        status: 'pass',
                        message: 'Sound playback test successful'
                    })
                } else {
                    addDiagnostic({
                        category: 'Audio System',
                        status: 'warning',
                        message: 'Audio context not initialized - user interaction required'
                    })
                }
            } catch (error) {
                addDiagnostic({
                    category: 'Audio System',
                    status: 'error',
                    message: 'Audio system failed',
                    details: error
                })
            }

            // 2. Test Import Resolution
            addDiagnostic({
                category: 'Module Imports',
                status: 'pass',
                message: 'Testing module imports...'
            })

            try {
                // Test dynamic imports
                const gameLogic = await import('../hooks/use-game-logic')
                const displayAdjustment = await import('../hooks/use-display-adjustment')

                if (typeof gameLogic.useGameLogic === 'function' && typeof displayAdjustment.useDisplayAdjustment === 'function') {
                    addDiagnostic({
                        category: 'Module Imports',
                        status: 'pass',
                        message: 'All game modules imported successfully'
                    })
                } else {
                    addDiagnostic({
                        category: 'Module Imports',
                        status: 'error',
                        message: 'Missing expected exports from game modules'
                    })
                }
            } catch (error) {
                addDiagnostic({
                    category: 'Module Imports',
                    status: 'error',
                    message: 'Module import failed',
                    details: error
                })
            }

            // 3. Test Component Rendering
            addDiagnostic({
                category: 'Component Rendering',
                status: 'pass',
                message: 'Testing component rendering...'
            })

            try {
                // Check if main game components exist in DOM
                const gameElements = {
                    root: document.getElementById('root'),
                    gameAreas: document.querySelectorAll('.game-area'),
                    fallingObjects: document.querySelectorAll('.falling-object')
                }

                if (gameElements.root) {
                    addDiagnostic({
                        category: 'Component Rendering',
                        status: 'pass',
                        message: 'Root element found'
                    })
                } else {
                    addDiagnostic({
                        category: 'Component Rendering',
                        status: 'error',
                        message: 'Root element not found'
                    })
                }

                addDiagnostic({
                    category: 'Component Rendering',
                    status: 'pass',
                    message: `Found ${gameElements.gameAreas.length} game areas, ${gameElements.fallingObjects.length} falling objects`
                })
            } catch (error) {
                addDiagnostic({
                    category: 'Component Rendering',
                    status: 'error',
                    message: 'Component rendering test failed',
                    details: error
                })
            }

            // 4. Test Performance API
            try {
                const performanceWithMemory = performance as PerformanceWithMemory
                const performanceData = {
                    memory: performanceWithMemory.memory ? {
                        used: Math.round(performanceWithMemory.memory.usedJSHeapSize / 1048576),
                        total: Math.round(performanceWithMemory.memory.totalJSHeapSize / 1048576),
                        limit: Math.round(performanceWithMemory.memory.jsHeapSizeLimit / 1048576)
                    } : null,
                    timing: performance.now(),
                    entries: performance.getEntriesByType('navigation')
                }

                if (performanceData.memory) {
                    const memoryUsage = (performanceData.memory.used / performanceData.memory.limit) * 100
                    if (memoryUsage > 80) {
                        addDiagnostic({
                            category: 'Performance',
                            status: 'warning',
                            message: `High memory usage: ${memoryUsage.toFixed(1)}%`,
                            details: performanceData.memory
                        })
                    } else {
                        addDiagnostic({
                            category: 'Performance',
                            status: 'pass',
                            message: `Memory usage: ${memoryUsage.toFixed(1)}%`,
                            details: performanceData.memory
                        })
                    }
                }

                addDiagnostic({
                    category: 'Performance',
                    status: 'pass',
                    message: 'Performance monitoring active'
                })
            } catch (error) {
                addDiagnostic({
                    category: 'Performance',
                    status: 'error',
                    message: 'Performance test failed',
                    details: error
                })
            }

            // 5. Test Event Tracker
            addDiagnostic({
                category: 'Event Tracking',
                status: 'pass',
                message: 'Testing event tracking system...'
            })

            try {
                // Test event tracker functionality
                eventTracker.trackEvent({
                    type: 'info',
                    category: 'diagnostic',
                    message: 'Diagnostic test event'
                })

                const recentEvents = eventTracker.getRecentEvents(5)
                addDiagnostic({
                    category: 'Event Tracking',
                    status: 'pass',
                    message: `Event tracker working - ${recentEvents.length} recent events`
                })
            } catch (error) {
                addDiagnostic({
                    category: 'Event Tracking',
                    status: 'error',
                    message: 'Event tracking test failed',
                    details: error
                })
            }

            // 6. Check for Console Errors
            addDiagnostic({
                category: 'Console Errors',
                status: 'pass',
                message: 'Checking browser console errors...'
            })

            // Get recent tracked errors
            const recentErrors = eventTracker.getRecentEvents(10).filter(e => e.type === 'error')
            const recentWarnings = eventTracker.getRecentEvents(10).filter(e => e.type === 'warning')

            if (recentErrors.length > 0) {
                addDiagnostic({
                    category: 'Console Errors',
                    status: 'error',
                    message: `Found ${recentErrors.length} recent errors`,
                    details: recentErrors
                })
            } else {
                addDiagnostic({
                    category: 'Console Errors',
                    status: 'pass',
                    message: 'No recent errors detected'
                })
            }

            if (recentWarnings.length > 0) {
                addDiagnostic({
                    category: 'Console Errors',
                    status: 'warning',
                    message: `Found ${recentWarnings.length} recent warnings`,
                    details: recentWarnings
                })
            }

        } catch (error) {
            addDiagnostic({
                category: 'System',
                status: 'error',
                message: 'Diagnostic system failed',
                details: error
            })
        }

        // Calculate overall system health
        const errors = diagnosticsRef.current.filter(d => d.status === 'error').length
        const warnings = diagnosticsRef.current.filter(d => d.status === 'warning').length

        setSystemHealth({
            overall: errors > 0 ? 'critical' : warnings > 2 ? 'warning' : 'healthy',
            audio: !diagnosticsRef.current.some(d => d.category === 'Audio System' && d.status === 'error'),
            rendering: !diagnosticsRef.current.some(d => d.category === 'Component Rendering' && d.status === 'error'),
            performance: !diagnosticsRef.current.some(d => d.category === 'Performance' && d.status === 'error'),
            imports: !diagnosticsRef.current.some(d => d.category === 'Module Imports' && d.status === 'error'),
            errors,
            warnings
        })

        setIsRunning(false)
    }, [addDiagnostic])

    useEffect(() => {
        // Run initial diagnostics after component mount
        const timer = setTimeout(() => {
            runComprehensiveDiagnostics()
        }, 1000)

        return () => clearTimeout(timer)
    }, [runComprehensiveDiagnostics])

    if (!isVisible) {
        return (
            <Button
                onClick={() => setIsVisible(true)}
                className="fixed top-4 right-4 z-50"
                variant={systemHealth.overall === 'critical' ? 'destructive' : systemHealth.overall === 'warning' ? 'secondary' : 'default'}
            >
                🔧 Diagnostics ({systemHealth.errors}E, {systemHealth.warnings}W)
            </Button>
        )
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
                <div className="p-4 border-b flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-bold">System Diagnostics</h2>
                        <Badge variant={systemHealth.overall === 'critical' ? 'destructive' : systemHealth.overall === 'warning' ? 'secondary' : 'default'}>
                            {systemHealth.overall.toUpperCase()}
                        </Badge>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={runComprehensiveDiagnostics} disabled={isRunning} size="sm">
                            {isRunning ? '🔄 Running...' : '🔍 Run Tests'}
                        </Button>
                        <Button onClick={() => setIsVisible(false)} variant="outline" size="sm">
                            ✕ Close
                        </Button>
                    </div>
                </div>

                <div className="p-4 grid grid-cols-5 gap-2 border-b">
                    <div className="text-center">
                        <div className={`text-2xl ${systemHealth.audio ? '✅' : '❌'}`}>
                            {systemHealth.audio ? '✅' : '❌'}
                        </div>
                        <div className="text-xs">Audio</div>
                    </div>
                    <div className="text-center">
                        <div className={`text-2xl ${systemHealth.rendering ? '✅' : '❌'}`}>
                            {systemHealth.rendering ? '✅' : '❌'}
                        </div>
                        <div className="text-xs">Rendering</div>
                    </div>
                    <div className="text-center">
                        <div className={`text-2xl ${systemHealth.performance ? '✅' : '❌'}`}>
                            {systemHealth.performance ? '✅' : '❌'}
                        </div>
                        <div className="text-xs">Performance</div>
                    </div>
                    <div className="text-center">
                        <div className={`text-2xl ${systemHealth.imports ? '✅' : '❌'}`}>
                            {systemHealth.imports ? '✅' : '❌'}
                        </div>
                        <div className="text-xs">Imports</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl">📊</div>
                        <div className="text-xs">{systemHealth.errors}E / {systemHealth.warnings}W</div>
                    </div>
                </div>

                <div className="flex-1 overflow-auto p-4">
                    <div className="space-y-2">
                        {diagnostics.map((diagnostic, index) => (
                            <div key={index} className={`p-3 rounded border-l-4 ${diagnostic.status === 'error' ? 'border-red-500 bg-red-50' :
                                diagnostic.status === 'warning' ? 'border-yellow-500 bg-yellow-50' :
                                    'border-green-500 bg-green-50'
                                }`}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-medium flex items-center gap-2">
                                            <span className={diagnostic.status === 'error' ? 'text-red-600' : diagnostic.status === 'warning' ? 'text-yellow-600' : 'text-green-600'}>
                                                {diagnostic.status === 'error' ? '❌' : diagnostic.status === 'warning' ? '⚠️' : '✅'}
                                            </span>
                                            {diagnostic.category}
                                        </div>
                                        <div className="text-sm text-gray-600 mt-1">{diagnostic.message}</div>
                                        {diagnostic.details !== undefined && (
                                            <details className="mt-2">
                                                <summary className="text-xs text-gray-500 cursor-pointer">Details</summary>
                                                <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                                                    {(() => {
                                                        if (typeof diagnostic.details === 'string') {
                                                            return diagnostic.details
                                                        }
                                                        try {
                                                            return JSON.stringify(diagnostic.details, (_key, value) => {
                                                                if (value instanceof Error) {
                                                                    return { name: value.name, message: value.message, stack: value.stack }
                                                                }
                                                                return value
                                                            }, 2)
                                                        } catch {
                                                            return String(diagnostic.details)
                                                        }
                                                    })()}
                                                </pre>
                                            </details>
                                        )}
                                    </div>
                                    <div className="text-xs text-gray-400">
                                        {new Date(diagnostic.timestamp).toLocaleTimeString()}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </Card>
        </div>
    )
}