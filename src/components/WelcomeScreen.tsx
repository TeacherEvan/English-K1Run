import { memo, startTransition, useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { soundManager } from '../lib/sound-manager'

interface WelcomeScreenProps {
  onComplete: () => void
}

type AudioPhase = 1 | 2 | 3 | 4 | null

/**
 * WelcomeScreen - Premium splash screen for Sangsom Kindergarten partnership
 *
 * Features:
 * - Four-phase sequential audio (2 English + 2 Thai translations)
 * - Phase-based text overlays synced with audio
 * - Preloads welcome audio to avoid first-play jank
 * - Waits for user tap/click (or Enter/Space) after audio sequence
 * - Escape skips immediately
 *
 * Audio Sequence:
 * 1. English: welcome_association (~3s)
 * 2. English: welcome_learning (~3s)
 * 3. Thai translation: welcome_association_thai (~3s)
 * 4. Thai translation: welcome_learning_thai (~3s)
 * Then: waits for user input to continue
 *
 * @component
 */
export const WelcomeScreen = memo(({ onComplete }: WelcomeScreenProps) => {
  const { t } = useTranslation()
  const [fadeOut, setFadeOut] = useState(false)
  const [currentPhase, setCurrentPhase] = useState<AudioPhase>(null)
  const [readyToContinue, setReadyToContinue] = useState(false)
  const splashSrc = '/welcome-sangsom.png'
  const isE2E = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('e2e')

  // Text content for each audio phase using i18n
  const phaseContent = {
    1: {
      english: t('welcome.association'),
      thai: t('welcome.associationThai'),
      school: 'SANGSOM Kindergarten',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    },
    2: {
      english: t('welcome.learning'),
      thai: t('welcome.learningThai'),
      school: t('welcome.forEveryone'),
      fontFamily: 'system-ui, -apple-system, sans-serif'
    },
    3: {
      english: '',
      thai: '',
      school: '',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    },
    4: {
      english: '',
      thai: '',
      school: '',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }
  } as const

  // Phase to display when no audio phase has started yet (initial state)
  const INITIAL_PHASE_INDEX = 1 as const

  // Proceed to menu - stop audio and transition out
  const proceed = useCallback(() => {
    soundManager.stopAllAudio()
    startTransition(() => setFadeOut(true))
    setTimeout(onComplete, 350)
  }, [onComplete])

  useEffect(() => {
    if (isE2E) {
      // Deterministic bypass for Playwright (avoids audio + user-input gating)
      setTimeout(onComplete, 0)
      return
    }

    // Set ready to continue after brief delay - user can tap anytime
    const quickReadyTimer = setTimeout(() => {
      setReadyToContinue(true)
    }, 2000)

    let cancelled = false
    let audioStarted = false

    // Start audio playback - tries immediately, retries on user interaction
    const startAudioSequence = async () => {
      if (audioStarted || cancelled) return
      audioStarted = true

      try {
        // Phase 1: English
        if (!cancelled) setCurrentPhase(1)
        await soundManager.playSound('welcome_association')
        await new Promise(resolve => setTimeout(resolve, 2500))

        // Phase 2: English
        if (!cancelled) setCurrentPhase(2)
        await soundManager.playSound('welcome_learning')
        await new Promise(resolve => setTimeout(resolve, 2500))

        // Phase 3: Thai
        if (!cancelled) setCurrentPhase(3)
        await soundManager.playSound('welcome_association_thai')
        await new Promise(resolve => setTimeout(resolve, 2500))

        // Phase 4: Thai
        if (!cancelled) setCurrentPhase(4)
        await soundManager.playSound('welcome_learning_thai')
        await new Promise(resolve => setTimeout(resolve, 2500))

        if (!cancelled) setReadyToContinue(true)
      } catch (err) {
        if (import.meta.env.DEV) {
          console.log('[WelcomeScreen] Audio error:', err)
        }
        if (!cancelled) setReadyToContinue(true)
      }
    }

    // Try to start audio immediately (may fail without user interaction)
    startAudioSequence()

    // Fallback: Also trigger on first user interaction if audio hasn't started
    const handleInteraction = () => {
      if (!audioStarted && !cancelled) {
        startAudioSequence()
      }
    }

    // Listen for user interaction to unlock audio
    const events = ['click', 'touchstart', 'keydown']
    events.forEach(event => {
      document.addEventListener(event, handleInteraction, { once: true, passive: true })
    })

    return () => {
      cancelled = true
      clearTimeout(quickReadyTimer)
      soundManager.stopAllAudio()
      events.forEach(event => {
        document.removeEventListener(event, handleInteraction)
      })
    }
  }, [isE2E, onComplete])

  useEffect(() => {
    // Keyboard accessibility: Any key proceeds to menu
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        proceed()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => {
      window.removeEventListener('keydown', handleKey)
    }
  }, [proceed])

  return (
    <div
      className={`fixed inset-0 z-100 flex items-center justify-center transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'
        }`}
      data-testid="welcome-screen"
      style={{
        animation: fadeOut ? 'fadeOut 0.5s ease-out' : 'fadeIn 0.5s ease-in',
      }}
    >
      <img
        src={splashSrc}
        alt="Welcome"
        className="absolute inset-0 w-full h-full object-cover"
        data-testid="welcome-screen-splash"
        onClick={proceed}
      />

      {/* Text overlay - shows phase content or initial "Tap to start" message */}
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
            fontFamily: currentPhase !== null ? phaseContent[currentPhase].fontFamily : phaseContent[INITIAL_PHASE_INDEX].fontFamily,
          }}
        >
          {currentPhase !== null && phaseContent[currentPhase].english && (
            <p
              className="text-4xl md:text-5xl font-semibold mb-2"
              style={{ color: '#1a1a1a' }}
            >
              {phaseContent[currentPhase].english}
            </p>
          )}
          {currentPhase !== null && phaseContent[currentPhase].thai && (
            <p
              className="text-4xl md:text-5xl font-semibold mb-2"
              style={{ color: '#1a1a1a' }}
            >
              {phaseContent[currentPhase].thai}
            </p>
          )}
          {currentPhase !== null && phaseContent[currentPhase].school && (
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

          {/* Show initial content when phase is null (before audio starts) */}
          {currentPhase === null && (
            <>
              <p
                className="text-4xl md:text-5xl font-semibold mb-2"
                style={{ color: '#1a1a1a' }}
              >
                {phaseContent[INITIAL_PHASE_INDEX].english}
              </p>
              <p
                className="text-4xl md:text-5xl font-semibold mb-2"
                style={{ color: '#1a1a1a' }}
              >
                {phaseContent[INITIAL_PHASE_INDEX].thai}
              </p>
              <p
                className="text-5xl md:text-6xl font-bold mb-4"
                style={{
                  color: '#f59e0b',
                  textShadow: '2px 2px 4px rgba(0, 0, 0, 0.1)',
                }}
              >
                {phaseContent[INITIAL_PHASE_INDEX].school}
              </p>
            </>
          )}

          {/* Always show tap instruction (either "Tap to start" or "Tap to continue") */}
          <p
            className="text-2xl md:text-3xl font-semibold mt-4"
            style={{
              color: '#1a1a1a',
              animation: 'pulse 2s ease-in-out infinite'
            }}
          >
            {readyToContinue ? 'Tap to continue' : 'Tap to start'}
          </p>
        </div>
      </div>

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

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div >
  )
})

WelcomeScreen.displayName = 'WelcomeScreen'
