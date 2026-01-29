import { memo, startTransition, useCallback, useEffect, useRef, useState } from 'react'
import { audioContextManager } from '../lib/audio/audio-context-manager'
import { soundManager } from '../lib/sound-manager'
import './WelcomeScreen.css'

interface WelcomeScreenProps {
  onComplete: () => void
}

export const WelcomeScreen = memo(({ onComplete }: WelcomeScreenProps) => {
  const [fadeOut, setFadeOut] = useState(false)
  const [readyToContinue, setReadyToContinue] = useState(false)
  const [sequenceFinished, setSequenceFinished] = useState(false)
  const [videoLoaded, setVideoLoaded] = useState(false)
  const [showFallbackImage, setShowFallbackImage] = useState(false)
  const audioStartedRef = useRef(false)
  const startAudioSequenceRef = useRef<(() => void) | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const videoSrc = '/New_welcome_video.mp4'
  const fallbackImageSrc = '/welcome-sangsom.png'
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
      // Deterministic bypass for Playwright - but still show UI briefly for testing
      // Use setTimeout to avoid synchronous setState in effect
      const readyTimer = setTimeout(() => setReadyToContinue(true), 0)
      const completeTimer = setTimeout(onComplete, 500)
      return () => {
        clearTimeout(readyTimer)
        clearTimeout(completeTimer)
      }
    }

    // Safety timer: If audio system fails or hangs, enable continue button after 10s
    // and auto-advance after 15s. This prevents "Stuck on loading" issues.
    const safetyBtnTimer = setTimeout(() => {
      console.log("[WelcomeScreen] Safety timer: Enabling interaction fallback")
      setReadyToContinue(true)
    }, 10000)

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
      let timedOut = false
      const timeout = new Promise<void>((_, reject) =>
        setTimeout(() => {
          timedOut = true
          reject(new Error('Audio timeout'))
        }, 8000)
      )
      try {
        await Promise.race([
          soundManager.playSound(name, playbackRate, volume),
          timeout
        ])
      } catch (e) {
        console.warn(`[WelcomeScreen] Audio ${name} timed out or failed:`, e)
        if (timedOut) {
          soundManager.stopAllAudio()
        }
      }
    }

    // Start audio playback - tries immediately, retries on user interaction
    const startAudioSequence = async () => {
      // Prevent multiple starts or running if cancelled
      const isReady = readyToContinue;
      console.log("[WelcomeScreen] startAudioSequence called:", {
        audioStarted: audioStartedRef.current,
        cancelled,
        readyToContinue: isReady,
        timestamp: Date.now()
      });

      if (audioStartedRef.current || cancelled) {
        console.log("[WelcomeScreen] Audio sequence blocked by guard condition");
        return;
      }
      audioStartedRef.current = true;

      try {
        console.log("[WelcomeScreen] Starting audio sequence...", {
          audioContextState: soundManager.isInitialized() ? 'initialized' : 'not initialized',
          timestamp: Date.now()
        });

        // Ensure AudioContext is resumed before playing (browser autoplay policy)
        const audioContext = audioContextManager.getContext();
        if (audioContext?.state === "suspended") {
          await audioContext.resume();
          console.log("[WelcomeScreen] AudioContext resumed successfully");
        }

        // Ensure nothing else is playing under the narration.
        soundManager.stopAllAudio()

        const checkActive = () => {
          if (cancelled || readyToContinue) throw new Error('Sequence cancelled');
        };

        // Phase 1: English
        checkActive();
        console.log("[WelcomeScreen] Playing phase 1: welcome_association");
        await playWithTimeout('welcome_association', 0.9, 0.85)

        // Phase 2: English
        checkActive();
        await new Promise(resolve => setTimeout(resolve, 300))
        checkActive();
        console.log("[WelcomeScreen] Playing phase 2: welcome_learning");
        await playWithTimeout('welcome_learning', 0.9, 0.85)

        // Phase 3: Thai intro
        checkActive();
        await new Promise(resolve => setTimeout(resolve, 300))
        checkActive();
        console.log("[WelcomeScreen] Playing phase 3: welcome_association_thai");
        await playWithTimeout('welcome_association_thai', 0.8, 0.95)

        // Phase 4: Thai (Slowed)
        checkActive();
        await new Promise(resolve => setTimeout(resolve, 300))
        checkActive();
        console.log("[WelcomeScreen] Playing phase 4: welcome_learning_thai");
        await playWithTimeout('welcome_learning_thai', 0.8, 0.95)

        if (!cancelled && !isReady) {
          console.log("[WelcomeScreen] Sequence finished normally")
          setReadyToContinue(true)
          setSequenceFinished(true)
        }
      } catch (err) {
        // Only log warning if it wasn't an intentional cancellation
        console.log("[WelcomeScreen] Audio sequence error:", {
          error: err instanceof Error ? err.message : String(err),
          audioStarted: audioStartedRef.current,
          readyToContinue: isReady,
          timestamp: Date.now()
        });
        if (err instanceof Error && err.message !== 'Sequence cancelled') {
          console.warn('[WelcomeScreen] Audio sequence failed:', err)
        }
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
      console.log("[WelcomeScreen] Document interaction detected:", {
        audioStarted: audioStartedRef.current,
        cancelled,
        timestamp: Date.now()
      });
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
  }, [isE2E, onComplete, readyToContinue, sequenceFinished])

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

  useEffect(() => {
    if (!videoLoaded || isE2E) return;
    console.log("[WelcomeScreen] Video loaded, triggering audio sequence");
    startAudioSequenceRef.current?.()
  }, [isE2E, videoLoaded])

  return (
    <div
      className={`fixed inset-0 z-100 flex items-center justify-center transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'
        }`}
      data-testid="welcome-screen"
      style={{
        animation: fadeOut ? 'fadeOut 0.5s ease-out' : 'fadeIn 0.5s ease-in',
        background: '#000',
      }}
      onClick={handlePrimaryAction}
    >
      {/* Video Background - Full Screen with autoplay */}
      <video
        ref={videoRef}
        className="welcome-video"
        src={videoSrc}
        autoPlay
        muted
        playsInline
        preload="auto"
        onCanPlay={() => setVideoLoaded(true)}
        onPlay={() => startAudioSequenceRef.current?.()}
        onEnded={() => {
          setShowFallbackImage(true)
          setReadyToContinue(true)
        }}
        onError={() => setVideoLoaded(false)}
        poster={fallbackImageSrc}
        data-testid="welcome-video"
      />

      {/* Fallback static image if video fails to load */}
      {(!videoLoaded || showFallbackImage) && (
        <>
          <img
            src={fallbackImageSrc}
            alt="Welcome to Sangsom Kindergarten"
            className={`absolute inset-0 w-full h-full object-cover z-5 ${showFallbackImage ? 'welcome-fallback-pop' : ''}`}
            data-testid="welcome-screen-fallback"
          />
          {showFallbackImage && (
            <div className="welcome-image-overlay">
              <div className="welcome-image-text" role="status" aria-live="polite">Tap to continue</div>
            </div>
          )}
        </>
      )}

      {readyToContinue && !showFallbackImage && (
        <div className="welcome-image-overlay">
          <div className="welcome-image-text" role="status" aria-live="polite">Tap to continue</div>
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
      `}</style>
    </div >
  )
})

WelcomeScreen.displayName = 'WelcomeScreen'