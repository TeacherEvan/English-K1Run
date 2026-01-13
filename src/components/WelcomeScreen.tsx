import { memo, startTransition, useCallback, useEffect, useRef, useState } from 'react'
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
  const [sequenceFinished, setSequenceFinished] = useState(false)
  const audioStartedRef = useRef(false)
  const startAudioSequenceRef = useRef<(() => void) | null>(null)
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

  const handlePrimaryAction = useCallback(() => {
    if (isE2E) {
      proceed()
      return
    }

    // First interaction should unlock and begin audio on browsers with autoplay blocking.
    if (!readyToContinue) {
      startAudioSequenceRef.current?.()
      return
    }

    proceed()
  }, [isE2E, proceed, readyToContinue])

  useEffect(() => {
    if (isE2E) {
      // Deterministic bypass for Playwright
      setTimeout(onComplete, 0)
      return
    }

    // Safety timer: If audio system fails or hangs, enable continue button after 3s
    // and auto-advance after 15s. This prevents "Stuck on loading" issues.
    const safetyBtnTimer = setTimeout(() => {
      console.log("[WelcomeScreen] Safety timer: Enabling interaction fallback")
      setReadyToContinue(true)
    }, 3000)

    const safetyEndTimer = setTimeout(() => {
      if (!sequenceFinished) {
        console.warn("[WelcomeScreen] Safety timer triggered - forcing sequence completion");
        setSequenceFinished(true)
        setReadyToContinue(true)
      }
    }, 15000)

    let cancelled = false

    // Timeout wrapper for audio calls to prevent infinite hanging
    const playWithTimeout = async (name: string, playbackRate: number, volume: number) => {
      const timeout = new Promise<void>((_, reject) =>
        setTimeout(() => reject(new Error('Audio timeout')), 4000)
      )
      try {
        await Promise.race([
          soundManager.playSound(name, playbackRate, volume),
          timeout
        ])
      } catch (e) {
        console.warn(`[WelcomeScreen] Audio ${name} timed out or failed:`, e)
      }
    }

    // Start audio playback - tries immediately, retries on user interaction
    const startAudioSequence = async () => {
      if (audioStartedRef.current || cancelled) return
      audioStartedRef.current = true

      try {
        console.log("[WelcomeScreen] Starting audio sequence...");
        // Ensure nothing else is playing under the narration.
        soundManager.stopAllAudio()

        // Phase 1: English
        if (!cancelled) setCurrentPhase(1)
        await playWithTimeout('welcome_association', 0.9, 0.85)
        await new Promise(resolve => setTimeout(resolve, 300))

        // Phase 2: English
        if (!cancelled) setCurrentPhase(2)
        await playWithTimeout('welcome_learning', 0.9, 0.85)
        await new Promise(resolve => setTimeout(resolve, 300))

        // Phase 3: Thai (Slowed)
        if (!cancelled) setCurrentPhase(3)
        // Thai: slowed by 20% for clarity
        await playWithTimeout('welcome_association_thai', 0.8, 0.95)
        await new Promise(resolve => setTimeout(resolve, 300))

        // Phase 4: Thai (Slowed)
        if (!cancelled) setCurrentPhase(4)
        // Thai: slowed by 20% for clarity
        await playWithTimeout('welcome_learning_thai', 0.8, 0.95)

        if (!cancelled) {
          console.log("[WelcomeScreen] Sequence finished normally")
          setReadyToContinue(true)
          setSequenceFinished(true)
        }
      } catch (err) {
        console.warn('[WelcomeScreen] Audio sequence failed:', err)
        if (!cancelled) {
          setReadyToContinue(true)
          setSequenceFinished(true)
        }
      }
    }

    // Expose starter for user interaction (autoplay policies require gesture)
    startAudioSequenceRef.current = () => {
      void startAudioSequence()
    }

    // Fallback: Also trigger on first user interaction if audio hasn't started
    const handleInteraction = () => {
      if (!audioStartedRef.current && !cancelled) {
        void startAudioSequence()
      }
    }

    // Listen for user interaction to unlock audio
    const events = ['click', 'touchstart', 'keydown'] as const
    events.forEach(event => {
      document.addEventListener(event, handleInteraction, { once: true, passive: true })
    })

    return () => {
      cancelled = true
      clearTimeout(safetyBtnTimer)
      clearTimeout(safetyEndTimer)
      soundManager.stopAllAudio()
      startAudioSequenceRef.current = null
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
        handlePrimaryAction()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => {
      window.removeEventListener('keydown', handleKey)
    }
  }, [handlePrimaryAction])

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
        onClick={handlePrimaryAction}
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
