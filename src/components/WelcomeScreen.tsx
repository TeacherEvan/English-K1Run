import { memo, startTransition, useCallback, useEffect, useMemo, useState } from 'react'
import { preloadResources } from '../lib/resource-preloader'
import { soundManager } from '../lib/sound-manager'

interface WelcomeScreenProps {
  onComplete: () => void
}

/**
 * WelcomeScreen - Premium splash screen for Sangsom Kindergarten partnership
 * 
 * Features:
 * - Sequential audio: intellectual voice → children's choir
 * - Dynamic text phases synced with audio
 * - Inspired by Sangsom's modern architecture and sun branding
 * - Smooth fade animations with visual storytelling
 * - Auto-dismisses after complete audio sequence
 * 
 * Audio Sequence:
 * 1. "In association with SANGSOM Kindergarten" (intellectual voice, ~3s)
 * 2. "Learning through games for everyone!" (children's choir, ~3s)
 * 
 * @component
 */
export const WelcomeScreen = memo(({ onComplete }: WelcomeScreenProps) => {
  const [fadeOut, setFadeOut] = useState(false)
  const [audioPhase, setAudioPhase] = useState<'intro' | 'tagline'>('intro')
  const [showTagline, setShowTagline] = useState(false)
  const [showSkip, setShowSkip] = useState(false)

  // Precompute fish sprites so they animate independently without re-renders
  const fishSchool = useMemo(
    () =>
      [
        { top: 18, size: 44, duration: 14, delay: 0.2, direction: 'right' as const, opacity: 0.55 },
        { top: 26, size: 36, duration: 16, delay: 1.1, direction: 'left' as const, opacity: 0.4 },
        { top: 34, size: 50, duration: 15, delay: 0.6, direction: 'right' as const, opacity: 0.6 },
        { top: 45, size: 30, duration: 13, delay: 1.8, direction: 'left' as const, opacity: 0.35 },
        { top: 58, size: 38, duration: 17, delay: 0.9, direction: 'right' as const, opacity: 0.5 },
        { top: 72, size: 32, duration: 15, delay: 1.4, direction: 'left' as const, opacity: 0.45 },
      ].map((item, idx) => ({ ...item, id: `fish-${idx}` })),
    []
  )

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

    // Reveal Skip after a short moment
    const skipTimer = setTimeout(() => setShowSkip(true), 1000)

    const playSequentialAudio = async () => {
      try {
        // Phase 1: Play "In association with SANGSOM Kindergarten" (intellectual voice)
        await soundManager.playSound('welcome_association')

        // Wait for first audio to complete (~3 seconds)
        await new Promise(resolve => setTimeout(resolve, 3000))

        // Transition to tagline phase
        setAudioPhase('tagline')
        setShowTagline(true)

        // Phase 2: Play "Learning through games for everyone!" (children's choir)
        await soundManager.playSound('welcome_learning')

        // Wait for second audio to complete (~3 seconds)
        await new Promise(resolve => setTimeout(resolve, 3000))

        // Start fade-out
        setFadeOut(true)

        // Complete after fade-out animation
        await new Promise(resolve => setTimeout(resolve, 500))
        onComplete()
      } catch (err) {
        if (import.meta.env.DEV) {
          console.log('[WelcomeScreen] Audio playback error:', err)
        }
        // Fallback: auto-dismiss after 6 seconds if audio fails
        setTimeout(() => {
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
      clearTimeout(skipTimer)
    }
  }, [onComplete, skip])

  // Confetti layer (limited count, transform-only anims)
  const confetti = useMemo(
    () =>
      [
        { emoji: '🎈', top: 12, size: 32, duration: 10, delay: 0.2, drift: 'right' as const },
        { emoji: '🎉', top: 22, size: 28, duration: 12, delay: 0.6, drift: 'left' as const },
        { emoji: '🪄', top: 30, size: 30, duration: 11, delay: 0.9, drift: 'right' as const },
        { emoji: '🌈', top: 44, size: 34, duration: 13, delay: 0.4, drift: 'left' as const },
        { emoji: '🫧', top: 56, size: 26, duration: 12, delay: 0.7, drift: 'right' as const },
        { emoji: '🎨', top: 68, size: 30, duration: 11, delay: 0.5, drift: 'left' as const },
        { emoji: '🎵', top: 76, size: 28, duration: 12, delay: 0.8, drift: 'right' as const },
        { emoji: '✨', top: 84, size: 26, duration: 10, delay: 0.3, drift: 'left' as const },
      ].map((c, i) => ({ ...c, id: `confetti-${i}` })),
    []
  )

  return (
    <div
      className={`fixed inset-0 z-100 flex items-center justify-center bg-linear-to-br from-sky-100 via-amber-50 to-orange-100 transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'
        }`}
      style={{
        animation: fadeOut ? 'fadeOut 0.5s ease-out' : 'fadeIn 0.5s ease-in',
      }}
    >
      {/* Skip control (appears after a short delay) */}
      {showSkip && (
        <button
          type="button"
          onClick={skip}
          className="absolute top-4 left-4 rounded-full px-4 py-2 text-sm font-semibold bg-white/80 text-gray-800 shadow-md hover:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
          aria-label="Skip welcome"
        >
          Skip
        </button>
      )}

      {/* Ambient fish/sprite layer */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {fishSchool.map((fish, index) => (
          <div
            key={fish.id}
            className="absolute"
            style={{
              top: `${fish.top}%`,
              left: fish.direction === 'right' ? '-15%' : '115%',
              filter: 'blur(0.4px)',
              animation: `${fish.direction === 'right' ? 'swimRight' : 'swimLeft'} ${fish.duration}s ease-in-out ${fish.delay}s infinite`,
              animationDelay: `${fish.delay + index * 0.05}s`,
            }}
            aria-hidden
          >
            <span
              className="block rounded-full shadow-lg"
              style={{
                width: `${fish.size}px`,
                height: `${fish.size * 0.6}px`,
                background: 'radial-gradient(circle at 30% 40%, rgba(59,130,246,0.9), rgba(59,130,246,0.2) 60%)',
                boxShadow: '0 0 18px rgba(59,130,246,0.25)',
                opacity: fish.opacity,
                transform: 'rotate(-8deg)',
                position: 'relative',
                animation: `pulseScale ${fish.duration / 3}s ease-in-out infinite`,
              }}
            >
              <span
                className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{
                  width: `${fish.size * 0.35}px`,
                  height: `${fish.size * 0.35}px`,
                  background: 'radial-gradient(circle, rgba(14,165,233,0.9), rgba(14,165,233,0.1) 70%)',
                  filter: 'blur(1px)',
                }}
              />
            </span>
          </div>
        ))}
      </div>

      {/* Confetti/emoji layer (limited, transform-only) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {confetti.map((c, i) => (
          <div
            key={c.id}
            className="absolute"
            style={{
              top: `${c.top}%`,
              left: c.drift === 'right' ? `${5 + i * 10}%` : `${95 - i * 10}%`,
              animation: `floatConfetti ${c.duration}s ease-in-out ${c.delay}s infinite, ${c.drift === 'right' ? 'driftRight' : 'driftLeft'
                } ${c.duration * 2}s linear ${c.delay}s infinite`,
              willChange: 'transform',
            }}
            aria-hidden
          >
            <span style={{ fontSize: `${c.size}px`, filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.1))' }}>{c.emoji}</span>
          </div>
        ))}
      </div>

      {/* Main content container */}
      <div className="text-center px-8 animate-in zoom-in duration-700">
        {/* Sun Logo - Inspired by Sangsom Kindergarten branding */}
        <div className="mb-8 flex justify-center">
          <div
            className="relative"
            style={{
              animation: 'gentlePulse 2s ease-in-out infinite',
            }}
          >
            {/* Sun rays */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="w-32 h-32 rounded-full"
                style={{
                  background:
                    'radial-gradient(circle, rgba(255,215,0,0.3) 0%, rgba(255,215,0,0) 70%)',
                  animation: 'rotate 20s linear infinite',
                }}
              >
                {/* Animated rays */}
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-1 bg-linear-to-t from-yellow-400 to-transparent"
                    style={{
                      height: '48px',
                      left: '50%',
                      top: '50%',
                      transformOrigin: '0 0',
                      transform: `rotate(${i * 30}deg) translateX(-0.5px)`,
                      opacity: 0.6,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Sun center */}
            <div className="relative z-10 flex items-center justify-center w-24 h-24 bg-linear-to-br from-yellow-300 via-yellow-400 to-amber-500 rounded-full shadow-2xl border-4 border-yellow-200">
              {/* Happy face */}
              <div className="text-4xl" role="img" aria-label="Happy sun">
                😊
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic text content - changes with audio phase */}
        <div className="space-y-6 min-h-[300px] flex flex-col justify-center">
          {/* Phase 1: Partnership Introduction */}
          <div
            className={`transition-all duration-500 ${audioPhase === 'intro' ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none absolute'
              }`}
          >
            <p className="text-2xl font-semibold text-gray-700 mb-4">
              In association with
            </p>

            {/* Kindergarten name with premium gradient */}
            <h1
              className="text-6xl font-bold bg-linear-to-r from-amber-500 via-yellow-500 to-orange-500 bg-clip-text text-transparent"
              style={{
                textShadow: '0 4px 24px rgba(251, 191, 36, 0.3)',
                letterSpacing: '-0.02em',
              }}
            >
              SANGSOM
            </h1>
            <h2 className="text-4xl font-bold text-amber-600 mt-2">
              Kindergarten
            </h2>

            {/* Thai text */}
            <p
              className="text-3xl font-semibold text-amber-600 mt-3"
              style={{
                fontFamily: "'Sarabun', 'Noto Sans Thai', 'Tahoma', system-ui, sans-serif",
                fontWeight: 600,
              }}
            >
              อนุบาลสงสม
            </p>
          </div>

          {/* Phase 2: Tagline with Children's Energy */}
          <div
            className={`transition-all duration-700 ${showTagline ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95 pointer-events-none absolute'
              }`}
          >
            <div
              className="text-5xl font-bold bg-linear-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent px-8"
              style={{
                textShadow: '0 4px 24px rgba(139, 92, 246, 0.3)',
                animation: showTagline ? 'bounceIn 0.7s ease-out' : 'none',
                lineHeight: '1.2',
              }}
            >
              Learning through games
              <br />
              <span className="text-6xl font-extrabold">for everyone!</span>
            </div>
          </div>

          {/* Decorative stars - appear with tagline */}
          <div
            className={`flex justify-center gap-3 mt-6 transition-all duration-500 ${showTagline ? 'opacity-100' : 'opacity-0'
              }`}
          >
            {['🌟', '✨', '💫', '✨', '🌟'].map((emoji, i) => (
              <span
                key={i}
                className="text-3xl"
                style={{
                  animation: showTagline ? `twinkle ${1.5 + i * 0.2}s ease-in-out infinite` : 'none',
                  animationDelay: `${i * 0.1}s`,
                }}
              >
                {emoji}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Enhanced keyframe animations */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes fadeOut {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }

        @keyframes gentlePulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }

        @keyframes rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes twinkle {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(0.8);
          }
        }

        @keyframes bounceIn {
          0% {
            opacity: 0;
            transform: scale(0.3) translateY(30px);
          }
          50% {
            opacity: 1;
            transform: scale(1.05) translateY(-10px);
          }
          70% {
            transform: scale(0.95) translateY(5px);
          }
          100% {
            transform: scale(1) translateY(0);
          }
        }

        @keyframes swimRight {
          0% {
            transform: translateX(-10%) translateY(0);
          }
          50% {
            transform: translateX(55vw) translateY(6px);
          }
          100% {
            transform: translateX(120vw) translateY(-4px);
          }
        }

        @keyframes swimLeft {
          0% {
            transform: translateX(10%) translateY(0);
          }
          50% {
            transform: translateX(-55vw) translateY(-6px);
          }
          100% {
            transform: translateX(-120vw) translateY(4px);
          }
        }

        @keyframes pulseScale {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.06);
          }
        }

        /* Confetti animations (transform only) */
        @keyframes floatConfetti {
          0% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-10px) scale(1.05); }
          100% { transform: translateY(0) scale(1); }
        }
        @keyframes driftRight {
          0% { transform: translateX(0); }
          100% { transform: translateX(10vw); }
        }
        @keyframes driftLeft {
          0% { transform: translateX(0); }
          100% { transform: translateX(-10vw); }
        }

        /* Accessibility: reduce motion when user prefers */
        @media (prefers-reduced-motion: reduce) {
          .animate-in, .animate-out { animation: none !important; }
          * { transition: none !important; }
          /* Disable decorative layers */
          .pointer-events-none > div { animation: none !important; }
        }
      `}</style>
    </div>
  )
})

WelcomeScreen.displayName = 'WelcomeScreen'
