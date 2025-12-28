import { memo, startTransition, useCallback, useEffect, useState } from 'react'
import { preloadResources } from '../../lib/resource-preloader'
import { soundManager } from '../../lib/sound-manager'

// TODO: [OPTIMIZATION] Keep this component minimal while the splash stays a single image.

interface WelcomeScreenProps {
  onComplete: () => void
}

/**
 * WelcomeScreen - Premium splash screen for Sangsom Kindergarten partnership
 *
 * Features:
 * - Sequential audio narration tied to Sangsom branding
 * - Smooth fade transitions around the Gemini-generated splash image
 * - Keyboard skip handler for accessibility
 *
 * Audio Sequence:
 * 1. "In association with SANGSOM Kindergarten" (intellectual voice, ~3s)
 * 2. "Learning through games for everyone!" (children's choir, ~3s)
 * 3. "Learning through playing for everyone!" (Thai male, ~3s)
 */
export const WelcomeScreen = memo(({ onComplete }: WelcomeScreenProps) => {
  const [fadeOut, setFadeOut] = useState(false)
  const splashSrc = '/Gemini_Generated_Image_895eeq895eeq895e.png'

  const skip = useCallback(() => {
    soundManager.stopAllAudio()
    startTransition(() => setFadeOut(true))
    setTimeout(onComplete, 350)
  }, [onComplete])

  useEffect(() => {
    void preloadResources([
      { url: '/sounds/welcome_association.wav', type: 'audio', priority: 'high' },
      { url: '/sounds/welcome_learning.wav', type: 'audio', priority: 'high' },
      { url: '/sounds/welcome_learning_thai.wav', type: 'audio', priority: 'high' },
    ])

    const playSequentialAudio = async () => {
      try {
        await soundManager.playSound('welcome_association')
        await new Promise((resolve) => setTimeout(resolve, 3000))
        await soundManager.playSound('welcome_learning')
        await new Promise((resolve) => setTimeout(resolve, 3000))
        await soundManager.playSound('welcome_learning_thai')
        await new Promise((resolve) => setTimeout(resolve, 3000))
        setFadeOut(true)
        await new Promise((resolve) => setTimeout(resolve, 500))
        onComplete()
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error('[WelcomeScreen] Audio playback error:', err)
        }
        setTimeout(() => {
          setFadeOut(true)
          setTimeout(onComplete, 500)
        }, 6000)
      }
    }

    playSequentialAudio()

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'Escape') {
        e.preventDefault()
        skip()
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => {
      window.removeEventListener('keydown', handleKey)
    }
  }, [onComplete, skip])

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'
        }`}
      style={{
        animation: fadeOut ? 'fadeOut 0.5s ease-out' : 'fadeIn 0.5s ease-in',
      }}
    >
      <img
        src={splashSrc}
        alt="Welcome"
        className="absolute inset-0 w-full h-full object-cover"
        onClick={skip}
      />
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
      `}</style>
    </div>
  )
})

WelcomeScreen.displayName = 'WelcomeScreen'
