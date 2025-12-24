import { memo, useEffect, useState } from 'react'
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

  useEffect(() => {
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
  }, [onComplete])

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-br from-sky-100 via-amber-50 to-orange-100 transition-opacity duration-500 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
      style={{
        animation: fadeOut ? 'fadeOut 0.5s ease-out' : 'fadeIn 0.5s ease-in',
      }}
    >
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
                    className="absolute w-1 bg-gradient-to-t from-yellow-400 to-transparent"
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
            <div className="relative z-10 flex items-center justify-center w-24 h-24 bg-gradient-to-br from-yellow-300 via-yellow-400 to-amber-500 rounded-full shadow-2xl border-4 border-yellow-200">
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
            className={`transition-all duration-500 ${
              audioPhase === 'intro' ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none absolute'
            }`}
          >
            <p className="text-2xl font-semibold text-gray-700 mb-4">
              In association with
            </p>

            {/* Kindergarten name with premium gradient */}
            <h1
              className="text-6xl font-bold bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 bg-clip-text text-transparent"
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
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              อนุบาลสงสม
            </p>
          </div>

          {/* Phase 2: Tagline with Children's Energy */}
          <div
            className={`transition-all duration-700 ${
              showTagline ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95 pointer-events-none absolute'
            }`}
          >
            <div
              className="text-5xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent px-8"
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
            className={`flex justify-center gap-3 mt-6 transition-all duration-500 ${
              showTagline ? 'opacity-100' : 'opacity-0'
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
      `}</style>
    </div>
  )
})

WelcomeScreen.displayName = 'WelcomeScreen'
