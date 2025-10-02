import { useEffect, useState } from 'react'
import { Card } from './ui/card'

interface GameDebugProps {
    gameStarted: boolean
    objectCount: number
    targetEmoji: string
    currentTarget: string
}

export function GameDebug({ gameStarted, objectCount, targetEmoji, currentTarget }: GameDebugProps) {
    const [cssVars, setCssVars] = useState({
        fontScale: '0',
        objectScale: '0',
        turtleScale: '0',
        spacingScale: '0',
        fallSpeedScale: '0'
    })
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        const updateCssVars = () => {
            const root = document.documentElement
            setCssVars({
                fontScale: root.style.getPropertyValue('--font-scale') || 'not set',
                objectScale: root.style.getPropertyValue('--object-scale') || 'not set',
                turtleScale: root.style.getPropertyValue('--turtle-scale') || 'not set',
                spacingScale: root.style.getPropertyValue('--spacing-scale') || 'not set',
                fallSpeedScale: root.style.getPropertyValue('--fall-speed-scale') || 'not set'
            })
        }

        updateCssVars()
        const interval = setInterval(updateCssVars, 1000)
        return () => clearInterval(interval)
    }, [])

    if (!isVisible) {
        return (
            <button
                onClick={() => setIsVisible(true)}
                className="fixed bottom-4 right-4 z-50 bg-purple-600 text-white px-3 py-1 rounded-full text-sm shadow-lg hover:bg-purple-700 transition-colors"
            >
                Show Debug
            </button>
        )
    }

    return (
        <Card className="fixed bottom-4 right-4 z-50 p-3 bg-white/95 backdrop-blur-sm shadow-xl max-w-xs text-xs">
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-purple-600">Debug Info</h3>
                <button
                    onClick={() => setIsVisible(false)}
                    className="text-gray-500 hover:text-gray-700 font-bold"
                >
                    ✕
                </button>
            </div>

            <div className="space-y-1">
                <div className="flex justify-between">
                    <span className="font-semibold">Game Started:</span>
                    <span className={gameStarted ? 'text-green-600' : 'text-red-600'}>
                        {gameStarted ? 'Yes' : 'No'}
                    </span>
                </div>

                <div className="flex justify-between">
                    <span className="font-semibold">Objects:</span>
                    <span>{objectCount}</span>
                </div>

                <div className="flex justify-between">
                    <span className="font-semibold">Target:</span>
                    <span>{currentTarget || 'None'}</span>
                </div>

                <div className="flex justify-between">
                    <span className="font-semibold">Emoji:</span>
                    <span>{targetEmoji || 'None'}</span>
                </div>

                <hr className="my-2" />

                <div className="text-xs text-gray-600 font-semibold">CSS Variables:</div>

                <div className="flex justify-between text-[10px]">
                    <span>--font-scale:</span>
                    <span className="font-mono">{cssVars.fontScale}</span>
                </div>

                <div className="flex justify-between text-[10px]">
                    <span>--object-scale:</span>
                    <span className="font-mono">{cssVars.objectScale}</span>
                </div>

                <div className="flex justify-between text-[10px]">
                    <span>--turtle-scale:</span>
                    <span className="font-mono">{cssVars.turtleScale}</span>
                </div>

                <div className="flex justify-between text-[10px]">
                    <span>--spacing-scale:</span>
                    <span className="font-mono">{cssVars.spacingScale}</span>
                </div>

                <div className="flex justify-between text-[10px]">
                    <span>--fall-speed:</span>
                    <span className="font-mono">{cssVars.fallSpeedScale}</span>
                </div>
            </div>
        </Card>
    )
}
