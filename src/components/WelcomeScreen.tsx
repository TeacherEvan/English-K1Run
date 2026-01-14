import { memo, startTransition, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { LanguageContext } from '../context/language'
import { soundManager } from '../lib/sound-manager'
import { Button } from './ui/button'

interface WelcomeScreenProps {
  onComplete: () => void
}

export const WelcomeScreen = memo(({ onComplete }: WelcomeScreenProps) => {
  const [fadeOut, setFadeOut] = useState(false)
  const [readyToContinue, setReadyToContinue] = useState(false)
  const [sequenceFinished, setSequenceFinished] = useState(false)
  const audioStartedRef = useRef(false)
  const startAudioSequenceRef = useRef<(() => void) | null>(null)

  const languageContext = useContext(LanguageContext)
  const { language, setLanguage } = languageContext || { language: 'en', setLanguage: () => { } }

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
        setTimeout(() => reject(new Error('Audio timeout')), 8000)
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
        // Gradient background matching image's sky/grass for landscape seamless extension
        background: 'linear-gradient(to bottom, #87CEEB 0%, #A8D8EA 30%, #B8E6C1 60%, #6DBE4A 80%, #4A9E3A 100%)',
      }}
      onClick={handlePrimaryAction}
    >
      {/* Decorative clouds for landscape - left side */}
      <div className="absolute left-0 top-0 h-full w-1/4 pointer-events-none overflow-hidden hidden landscape:block">
        <div className="absolute top-[10%] left-[5%] text-6xl animate-float-slow opacity-90">☁️</div>
        <div className="absolute top-[25%] left-[15%] text-5xl animate-float-medium opacity-80">☁️</div>
        <div className="absolute top-[5%] left-[20%] text-4xl animate-float-fast opacity-70">☁️</div>
        {/* Animated children silhouettes - left */}
        <div className="absolute bottom-[15%] left-[10%] text-4xl animate-bounce-slow">🧒</div>
        <div className="absolute bottom-[18%] left-[20%] text-3xl animate-bounce-medium">👧</div>
      </div>

      {/* Decorative clouds for landscape - right side */}
      <div className="absolute right-0 top-0 h-full w-1/4 pointer-events-none overflow-hidden hidden landscape:block">
        <div className="absolute top-[15%] right-[10%] text-5xl animate-float-medium opacity-85">☁️</div>
        <div className="absolute top-[8%] right-[20%] text-6xl animate-float-slow opacity-90">☁️</div>
        <div className="absolute top-[30%] right-[5%] text-4xl animate-float-fast opacity-75">☁️</div>
        {/* Animated children silhouettes - right */}
        <div className="absolute bottom-[20%] right-[15%] text-4xl animate-bounce-medium">👦</div>
        <div className="absolute bottom-[12%] right-[8%] text-3xl animate-bounce-slow">🧒</div>
      </div>

      {/* Grass extension for landscape bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-[20%] pointer-events-none hidden landscape:block"
        style={{
          background: 'linear-gradient(to bottom, transparent 0%, #6DBE4A 30%, #4A9E3A 100%)',
        }}
      />

      {/* Main welcome image - uses contain to prevent cropping */}
      <img
        src={splashSrc}
        alt="Welcome to Sangsom Kindergarten"
        className="absolute inset-0 w-full h-full object-contain landscape:object-contain portrait:object-cover z-10"
        data-testid="welcome-screen-splash"
      />

      {/* Interactive Overlay - Language toggles only, Start Game is in the image */}
      <div className="absolute inset-0 pointer-events-none z-20">

        {/* Language Toggles - Bottom Right */}
        <div className="absolute bottom-6 right-6 flex gap-3 pointer-events-auto">
          <Button
            variant="outline"
            onClick={(e) => { e.stopPropagation(); setLanguage('en'); }}
            className={`w-14 h-14 rounded-xl text-xl font-bold border-2 transition-colors ${language === 'en'
                ? 'bg-[#E36C2F] text-white border-white'
                : 'bg-white/90 text-[#E36C2F] border-[#E36C2F]'
              }`}
          >
            EN
          </Button>
          <Button
            variant="outline"
            onClick={(e) => { e.stopPropagation(); setLanguage('th'); }}
            className={`w-14 h-14 rounded-xl text-xl font-bold border-2 transition-colors ${language === 'th'
                ? 'bg-[#E36C2F] text-white border-white'
                : 'bg-white/90 text-[#E36C2F] border-[#E36C2F]'
              }`}
          >
            TH
          </Button>
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

        /* Custom animations for clouds and children */
        @keyframes float-slow {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-15px) translateX(10px); }
        }
        @keyframes float-medium {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-10px) translateX(-8px); }
        }
        @keyframes float-fast {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-8px) translateX(5px); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes bounce-medium {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }

        .animate-float-slow { animation: float-slow 6s ease-in-out infinite; }
        .animate-float-medium { animation: float-medium 5s ease-in-out infinite; }
        .animate-float-fast { animation: float-fast 4s ease-in-out infinite; }
        .animate-bounce-slow { animation: bounce-slow 3s ease-in-out infinite; }
        .animate-bounce-medium { animation: bounce-medium 2.5s ease-in-out infinite; }

        /* Landscape media query */
        @media (orientation: landscape) {
          .landscape\\:block { display: block; }
          .landscape\\:object-contain { object-fit: contain; }
        }
        @media (orientation: portrait) {
          .portrait\\:object-cover { object-fit: cover; }
        }
        .hidden { display: none; }
      `}</style>
    </div >
  )
})

WelcomeScreen.displayName = 'WelcomeScreen'
