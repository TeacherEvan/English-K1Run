/**
 * Quick Debug Component - Shows background and audio status
 */

import { useEffect, useState } from 'react'
import { playSoundEffect, soundManager } from '../lib/sound-manager'
import { Button } from './ui/button'

export function QuickDebug() {
    const [isVisible, setIsVisible] = useState(false)
    const [audioStatus, setAudioStatus] = useState('Unknown')
    const [cssStatus, setCssStatus] = useState('Unknown')

    useEffect(() => {
        // Check CSS variables
        const root = document.documentElement
        const primaryColor = getComputedStyle(root).getPropertyValue('--primary')
        const secondaryColor = getComputedStyle(root).getPropertyValue('--secondary')
        const accentColor = getComputedStyle(root).getPropertyValue('--accent')

        if (primaryColor && secondaryColor && accentColor) {
            setCssStatus(`CSS OK - Primary: ${primaryColor.trim()}`)
        } else {
            setCssStatus('CSS Variables Missing!')
        }

        // Check audio
        if (soundManager.isInitialized()) {
            setAudioStatus('Audio Ready')
        } else {
            setAudioStatus('Audio Not Initialized')
        }
    }, [])

    const testAudio = async () => {
        try {
            await soundManager.ensureInitialized()
            await playSoundEffect.tap()
            setAudioStatus('Audio Working!')
        } catch (error) {
            setAudioStatus(`Audio Error: ${error}`)
        }
    }

    if (!isVisible) {
        return (
            <Button
                onClick={() => setIsVisible(true)}
                className="fixed bottom-4 left-4 z-50 bg-blue-500 hover:bg-blue-600"
                size="sm"
            >
                🐛 Debug
            </Button>
        )
    }

    return (
        <div className="fixed bottom-4 left-4 z-50 w-80 bg-white border rounded shadow-lg p-4">
            <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold">Quick Debug</h3>
                <Button onClick={() => setIsVisible(false)} size="sm" variant="outline">×</Button>
            </div>

            <div className="space-y-3">
                <div>
                    <strong>CSS Status:</strong>
                    <div className="text-sm text-gray-600">{cssStatus}</div>
                </div>

                <div>
                    <strong>Audio Status:</strong>
                    <div className="text-sm text-gray-600">{audioStatus}</div>
                </div>

                <Button onClick={testAudio} className="w-full" size="sm">
                    🔊 Test Audio
                </Button>

                <div className="text-xs text-gray-500">
                    Game areas with .game-area class: {document.querySelectorAll('.game-area').length}
                </div>

                <div className="h-16 game-area border rounded p-2 text-xs">
                    This box should have gradient background if CSS is working
                </div>
            </div>
        </div>
    )
}