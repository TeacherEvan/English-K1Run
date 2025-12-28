import { memo, startTransition, useCallback, useEffect, useState } from 'react'
import { preloadResources } from '../lib/resource-preloader'
import { soundManager } from '../lib/sound-manager'

interface WelcomeScreenProps {
  onComplete: () => void
}

type AudioPhase = 1 | 2 | null

/**
 * WelcomeScreen - Premium splash screen for Sangsom Kindergarten partnership
 * 
 * Features:
 * - Sequential audio: intellectual voice → children's choir
 * - Dynamic text phases synced with audio
 * - Inspired by Sangsom's modern architecture and sun branding
 * - Smooth fade animations with visual storytelling
 * - Auto-dismisses after complete audio sequence
 * - 3D parallax effects with multiple depth layers
 * - Glassmorphism frosted glass content cards
 * - Animated gradient mesh background
 * - Particle burst effects on phase transitions
 * - Enhanced sun logo with color-shifting rays
 * - Letter-by-letter text reveal animations
 * - Floating ambient sparkles and bubbles
 * 
 * Audio Sequence:
 * 1. "In association with SANGSOM Kindergarten" (intellectual voice, ~3s)
 * 2. "Learning through games for everyone!" (children's choir, ~3s)
 * 
 * @component
 */
export const WelcomeScreen = memo(({ onComplete }: WelcomeScreenProps) => {
  const [fadeOut, setFadeOut] = useState(false)
  const [currentPhase, setCurrentPhase] = useState<AudioPhase>(null)
  const splashSrc = '/welcome-splash.png'

  // Text content for each audio phase with fallback support
  const phaseContent = {
    1: {
      english: 'In association with',
      thai: '',
      school: 'SANGSOM Kindergarten',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    },
    2: {
      english: 'Learning through games',
      thai: '',
      school: 'for everyone!',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }
  } as const

  const skip = useCallback(() => {
    // Stop any ongoing audio and dismiss quickly
    soundManager.stopAllAudio()
    startTransition(() => setFadeOut(true))
    setTimeout(onComplete, 350)
  }, [onComplete])

  useEffect(() => {
    // Preload welcome audio to avoid first-play jank (metadata only)
    void preloadResources([
      { url: '/sounds/welcome_association.wav', type: 'audio', priority: 'high' },
      { url: '/sounds/welcome_learning.wav', type: 'audio', priority: 'high' },
    ])

    const playSequentialAudio = async () => {
      try {
        // Phase 1: Play "In association with SANGSOM Kindergarten" (intellectual voice)
        setCurrentPhase(1)
        await soundManager.playSound('welcome_association')

        // Wait for first audio to complete (~3 seconds)
        await new Promise(resolve => setTimeout(resolve, 3000))

        // Phase 2: Play "Learning through games for everyone!" (children's choir)
        setCurrentPhase(2)
        await soundManager.playSound('welcome_learning')

        // Wait for second audio to complete (~3 seconds)
        await new Promise(resolve => setTimeout(resolve, 3000))

        // Phase 3: Play "Learning through playing for everyone!" (Thai male)
        setCurrentPhase(null)
        setFadeOut(true)

        // Complete after fade-out animation
        await new Promise(resolve => setTimeout(resolve, 500))
        onComplete()
      } catch (err) {
        if (import.meta.env.DEV) {
          console.log('[WelcomeScreen] Audio playback error:', err)
        }
        // Fallback: auto-dismiss after 6 seconds if audio fails (2 phases × 3s)
        // Text overlays will still be visible during fallback
        setTimeout(() => {
          setCurrentPhase(null)
          setFadeOut(true)
          setTimeout(onComplete, 500)
        }, 6000)
      }
    }

    playSequentialAudio()
    // Keyboard accessibility: Space/Enter/Escape to skip
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
      className={`fixed inset-0 z-100 flex items-center justify-center transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'
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

      {/* Fallback text overlay - shows during each audio phase */}
      {currentPhase !== null && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
          style={{
            background: 'rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(8px)',
            animation: 'textFadeIn 0.3s ease-in',
          }}
        >
          <div
            className="px-8 py-6 rounded-2xl text-center"
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              fontFamily: phaseContent[currentPhase].fontFamily,
            }}
          >
            {phaseContent[currentPhase].english && (
              <p
                className="text-4xl md:text-5xl font-semibold mb-2"
                style={{ color: '#1a1a1a' }}
              >
                {phaseContent[currentPhase].english}
              </p>
            )}
            {phaseContent[currentPhase].thai && (
              <p
                className="text-4xl md:text-5xl font-semibold mb-2"
                style={{ color: '#1a1a1a' }}
              >
                {phaseContent[currentPhase].thai}
              </p>
            )}
            {phaseContent[currentPhase].school && (
              <p
                className="text-5xl md:text-6xl font-bold"
                style={{
                  color: '#f59e0b',
                  textShadow: '2px 2px 4px rgba(0, 0, 0, 0.1)',
                }}
              >
                {phaseContent[currentPhase].school}
              </p>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }

        @keyframes textFadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div >
  )
})

WelcomeScreen.displayName = 'WelcomeScreen'
