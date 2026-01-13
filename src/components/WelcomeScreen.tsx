import { memo, startTransition, useCallback, useEffect, useRef, useState } from 'react'
import { soundManager } from '../lib/sound-manager'

interface WelcomeScreenProps {
  onComplete: () => void
}


export const WelcomeScreen = memo(({ onComplete }: WelcomeScreenProps) => {
  const [fadeOut, setFadeOut] = useState(false)
  const [readyToContinue, setReadyToContinue] = useState(false)
  const [sequenceFinished, setSequenceFinished] = useState(false)
  const audioStartedRef = useRef(false)
  const startAudioSequenceRef = useRef<(() => void) | null>(null)
  const splashSrc = '/welcome-sangsom.png'
  const isE2E = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('e2e')

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
        await playWithTimeout('welcome_association', 0.9, 0.85)
        await new Promise(resolve => setTimeout(resolve, 300))

        // Phase 2: English
        await playWithTimeout('welcome_learning', 0.9, 0.85)
        await new Promise(resolve => setTimeout(resolve, 300))

        // Phase 3: Thai (Slowed)
        // Thai: slowed by 20% for clarity
        await playWithTimeout('welcome_association_thai', 0.8, 0.95)
        await new Promise(resolve => setTimeout(resolve, 300))

        // Phase 4: Thai (Slowed)
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

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
      `}</style>
    </div >
  )
})

WelcomeScreen.displayName = 'WelcomeScreen'
