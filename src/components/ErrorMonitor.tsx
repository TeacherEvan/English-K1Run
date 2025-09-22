/**
 * Simple Error Monitor - Real-time error detection and reporting
 */

import { useEffect, useState } from 'react'
import { Button } from './ui/button'

interface ErrorInfo {
    message: string
    timestamp: number
    type: 'error' | 'warning' | 'info'
    source?: string
}

export function ErrorMonitor() {
    const [errors, setErrors] = useState<ErrorInfo[]>([])
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        const errorHandler = (event: ErrorEvent) => {
            setErrors(prev => [...prev.slice(-9), {
                message: event.message,
                timestamp: Date.now(),
                type: 'error',
                source: event.filename
            }])
        }

        const rejectionHandler = (event: PromiseRejectionEvent) => {
            setErrors(prev => [...prev.slice(-9), {
                message: `Promise rejected: ${event.reason}`,
                timestamp: Date.now(),
                type: 'error',
                source: 'promise'
            }])
        }

        const consoleErrorOriginal = console.error
        console.error = (...args) => {
            setErrors(prev => [...prev.slice(-9), {
                message: args.join(' '),
                timestamp: Date.now(),
                type: 'error',
                source: 'console'
            }])
            consoleErrorOriginal.apply(console, args)
        }

        const consoleWarnOriginal = console.warn
        console.warn = (...args) => {
            setErrors(prev => [...prev.slice(-9), {
                message: args.join(' '),
                timestamp: Date.now(),
                type: 'warning',
                source: 'console'
            }])
            consoleWarnOriginal.apply(console, args)
        }

        window.addEventListener('error', errorHandler)
        window.addEventListener('unhandledrejection', rejectionHandler)

        return () => {
            window.removeEventListener('error', errorHandler)
            window.removeEventListener('unhandledrejection', rejectionHandler)
            console.error = consoleErrorOriginal
            console.warn = consoleWarnOriginal
        }
    }, [])

    const errorCount = errors.filter(e => e.type === 'error').length
    const warningCount = errors.filter(e => e.type === 'warning').length

    if (!isVisible) {
        return (
            <Button
                onClick={() => setIsVisible(true)}
                className={`fixed top-4 right-4 z-50 ${errorCount > 0 ? 'bg-red-500 hover:bg-red-600' : warningCount > 0 ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'}`}
                size="sm"
            >
                🔧 {errorCount}E {warningCount}W
            </Button>
        )
    }

    return (
        <div className="fixed top-4 right-4 z-50 w-96 max-h-80 bg-white border rounded shadow-lg overflow-hidden">
            <div className="p-3 bg-gray-100 border-b flex justify-between items-center">
                <h3 className="font-bold">Error Monitor</h3>
                <div className="flex gap-2">
                    <Button onClick={() => setErrors([])} size="sm" variant="outline">Clear</Button>
                    <Button onClick={() => setIsVisible(false)} size="sm" variant="outline">×</Button>
                </div>
            </div>
            <div className="max-h-64 overflow-auto">
                {errors.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">No errors detected ✅</div>
                ) : (
                    errors.map((error, index) => (
                        <div key={index} className={`p-3 border-b ${error.type === 'error' ? 'bg-red-50' : error.type === 'warning' ? 'bg-yellow-50' : 'bg-blue-50'}`}>
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                                <span>{error.source}</span>
                                <span>{new Date(error.timestamp).toLocaleTimeString()}</span>
                            </div>
                            <div className={`text-sm ${error.type === 'error' ? 'text-red-700' : error.type === 'warning' ? 'text-yellow-700' : 'text-blue-700'}`}>
                                {error.message}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}