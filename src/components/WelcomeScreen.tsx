import { memo, startTransition, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { audioContextManager } from '../lib/audio/audio-context-manager'
import {
  DEFAULT_WELCOME_CONFIG,
  isWelcomeSequencePlaying,
  playWelcomeSequence,
  stopWelcomeSequence,
  type WelcomeAudioConfig,
} from '../lib/audio/welcome-audio-sequencer'
import { soundManager } from '../lib/sound-manager'
import './WelcomeScreen.css'

interface WelcomeScreenProps {
  onComplete: () => void
  /** Optional custom audio configuration */
  audioConfig?: Partial<WelcomeAudioConfig>
}

export const WelcomeScreen = memo(({ onComplete, audioConfig }: WelcomeScreenProps) => {
  const [fadeOut, setFadeOut] = useState(false)
  const [readyToContinue, setReadyToContinue] = useState(false)
  const sequenceFinishedRef = useRef(false)
  const [isSequencePlaying, setIsSequencePlaying] = useState(false)
  const [_videoLoaded, setVideoLoaded] = useState(false)
  const [_showFallbackImage, setShowFallbackImage] = useState(false)
  const [_currentAudioIndex, setCurrentAudioIndex] = useState(0)
  const [_totalAudioCount, setTotalAudioCount] = useState(0)
  const audioStartedRef = useRef(false)
  const startAudioSequenceRef = useRef<(() => void) | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const videoSrc = '/New_welcome_video.mp4'
  const fallbackImageSrc = '/welcome-sangsom.png'
  const isE2E = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('e2e')

  // Merge default config with any provided config
  const mergedAudioConfig: Partial<WelcomeAudioConfig> = useMemo(() => ({
    ...DEFAULT_WELCOME_CONFIG,
    // Prioritize ElevenLabs and sort by duration (longest first)
    sourcePriority: ['elevenlabs', 'generated', 'fallback'],
    durationSortOrder: 'desc',
    filterActiveTargets: true,
    sequentialDelayMs: 500,
    maxSequenceLength: 5,
    ...audioConfig,
  }), [audioConfig])

  // Proceed to menu - stop audio and transition out
  const proceed = useCallback(() => {
    stopWelcomeSequence()
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

    // Safety timer: Enable continue button after 8s and auto-advance after 12s if audio fails
    const safetyBtnTimer = setTimeout(() => {
      console.log("[WelcomeScreen] Safety timer: Enabling interaction fallback")
      setReadyToContinue(true)
    }, 8000)

    const safetyEndTimer = setTimeout(() => {
      if (!sequenceFinishedRef.current) {
        console.warn("[WelcomeScreen] Safety timer triggered - forcing sequence completion");
        sequenceFinishedRef.current = true
        setReadyToContinue(true)
      }
    }, 12000)

    let cancelled = false

    // Start audio playback - tries immediately, retries on user interaction
    const startAudioSequence = async () => {
      // Prevent multiple starts or running if cancelled
      const isReady = readyToContinue;
      if (import.meta.env.DEV) {
        console.log("[WelcomeScreen] startAudioSequence called:", {
          audioStarted: audioStartedRef.current,
          cancelled,
          readyToContinue: isReady,
          config: mergedAudioConfig,
          timestamp: Date.now()
        });
      }

      if (audioStartedRef.current || cancelled) {
        if (import.meta.env.DEV) {
          console.log("[WelcomeScreen] Audio sequence blocked by guard condition");
        }
        return;
      }
      audioStartedRef.current = true;

      // Sequence-level 15s timeout wrapper (accommodates multiple audio clips)
      const sequenceTimeout = new Promise<void>((_, reject) =>
        setTimeout(() => {
          reject(new Error('Sequence timeout after 15s'))
        }, 15000)
      )

      const runSequence = async () => {
        if (import.meta.env.DEV) {
          console.log("[WelcomeScreen] Starting welcome audio sequence with ElevenLabs priority...", {
            audioContextState: soundManager.isInitialized() ? 'initialized' : 'not initialized',
            config: mergedAudioConfig,
            timestamp: Date.now()
          });
        }

        // Ensure nothing else is playing before starting the sequence.
        soundManager.stopAllAudio()

        // Ensure AudioContext is resumed before playing (browser autoplay policy)
        const audioContext = audioContextManager.getContext();
        if (audioContext?.state === "suspended") {
          await audioContext.resume();
          if (import.meta.env.DEV) {
            console.log("[WelcomeScreen] AudioContext resumed successfully");
          }
        }

        if (cancelled || isReady) {
          throw new Error('Sequence cancelled');
        }

        // Play welcome audio sequence using the new sequencer
        // This will prioritize ElevenLabs assets and sort by duration (longest first)
        setIsSequencePlaying(true)
        await playWelcomeSequence(
          mergedAudioConfig,
          (current, total, asset) => {
            setCurrentAudioIndex(current)
            setTotalAudioCount(total)
            if (import.meta.env.DEV) {
              console.log(`[WelcomeScreen] Playing ${current}/${total}: ${asset.key} (${asset.duration}s)`);
            }
          }
        )

        if (!cancelled && !isReady) {
          if (import.meta.env.DEV) {
            console.log("[WelcomeScreen] Sequence finished normally")
          }
          setReadyToContinue(true)
          sequenceFinishedRef.current = true
          setIsSequencePlaying(false)
        }
      }

      try {
        await Promise.race([runSequence(), sequenceTimeout])
      } catch (err) {
        // Only log warning if it wasn't an intentional cancellation
        if (import.meta.env.DEV) {
          console.log("[WelcomeScreen] Audio sequence error:", {
            error: err instanceof Error ? err.message : String(err),
            audioStarted: audioStartedRef.current,
            readyToContinue: isReady,
            wasPlaying: isWelcomeSequencePlaying(),
            timestamp: Date.now()
          });
        }
        if (err instanceof Error && err.message !== 'Sequence cancelled') {
          console.warn('[WelcomeScreen] Audio sequence failed:', err)
        }
        if (!cancelled) {
          setReadyToContinue(true)
          sequenceFinishedRef.current = true
        }
      }
    }

    // Expose starter for user interaction (autoplay policies require gesture)
    startAudioSequenceRef.current = () => {
      void startAudioSequence()
    }

    // Fallback: Also trigger on first user interaction if audio hasn't started
    const handleInteraction = () => {
      if (import.meta.env.DEV) {
        console.log("[WelcomeScreen] Document interaction detected:", {
          audioStarted: audioStartedRef.current,
          cancelled,
          timestamp: Date.now()
        });
      }
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
      stopWelcomeSequence()
      soundManager.stopAllAudio()
      startAudioSequenceRef.current = null
      events.forEach(event => {
        document.removeEventListener(event, handleInteraction)
      })
    }
  }, [isE2E, onComplete, readyToContinue, mergedAudioConfig])

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
    // Single deterministic trigger with 100ms delay to ensure video is rendering
    if (!_videoLoaded || isE2E) return;
    if (import.meta.env.DEV) {
      console.log("[WelcomeScreen] Video loaded, scheduling audio sequence with 100ms delay");
    }
    const triggerTimer = setTimeout(() => {
      startAudioSequenceRef.current?.()
    }, 100)
    return () => clearTimeout(triggerTimer)
  }, [isE2E, _videoLoaded])

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
        onEnded={() => {
          setShowFallbackImage(true)
          setReadyToContinue(true)
        }}
        onError={() => setVideoLoaded(false)}
        poster={fallbackImageSrc}
        data-testid="welcome-video"
      />

      {/* Fallback static image if video fails to load */}
      {(!_videoLoaded || _showFallbackImage) && (
        <>
          <img
            src={fallbackImageSrc}
            alt="Welcome to Sangsom Kindergarten"
            className={`absolute inset-0 w-full h-full object-cover z-5 ${_showFallbackImage ? 'welcome-fallback-pop' : ''}`}
            data-testid="welcome-screen-fallback"
          />
          {_showFallbackImage && (
            <div className="welcome-image-overlay">
              <div className="welcome-image-text" role="status" aria-live="polite">Tap to continue</div>
            </div>
          )}
        </>
      )}

      {readyToContinue && !_showFallbackImage && (
        <div className="welcome-image-overlay">
          <div className="welcome-image-text" role="status" aria-live="polite">Tap to continue</div>
        </div>
      )}

      {/* Audio progress indicator (subtle) */}
      {isSequencePlaying && _totalAudioCount > 0 && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
          <div className="flex gap-2">
            {Array.from({ length: _totalAudioCount }).map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors duration-300 ${i < _currentAudioIndex ? 'bg-green-400' :
                  i === _currentAudioIndex ? 'bg-yellow-400 animate-pulse' :
                    'bg-white/30'
                  }`}
                data-testid={`audio-progress-${i}`}
              />
            ))}
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
      `}</style>
    </div >
  )
})

WelcomeScreen.displayName = 'WelcomeScreen'
