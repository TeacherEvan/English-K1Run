import { memo, useEffect, useState } from 'react'
import { playSoundEffect } from '../lib/sound-manager'

interface WelcomeScreenProps {
  onComplete: () => void
}

/**
 * WelcomeScreen - Thoughtful splash screen for Sangsom Kindergarten partnership
 * 
 * Features:
 * - Warm, welcoming design with sun logo
 * - 5-second happy monophonic tune
 * - Smooth fade animations
 * - Auto-dismisses after display duration
 * - Optimized for user gratification and engagement
 * 
 * @component
 */
export const WelcomeScreen = memo(({ onComplete }: WelcomeScreenProps) => {
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    // Play welcome tune on mount
    playSoundEffect.welcome().catch(err => {
      if (import.meta.env.DEV) {
        console.log('[WelcomeScreen] Could not play welcome audio:', err)
      }
    })

    // Start fade-out animation at 4.5 seconds
    const fadeTimer = setTimeout(() => {
      setFadeOut(true)
    }, 4500)

    // Complete and unmount at 5 seconds
    const completeTimer = setTimeout(() => {
      onComplete()
    }, 5000)

    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(completeTimer)
    }
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

        {/* Partnership text */}
        <div className="space-y-4">
          <p
            className="text-2xl font-semibold text-gray-700 animate-in slide-in-from-bottom-4 duration-700"
            style={{
              animationDelay: '0.2s',
              animationFillMode: 'backwards',
            }}
          >
            In association with
          </p>

          {/* Kindergarten name with Thai-inspired styling */}
          <h1
            className="text-5xl font-bold bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 bg-clip-text text-transparent animate-in slide-in-from-bottom-4 duration-700"
            style={{
              animationDelay: '0.4s',
              animationFillMode: 'backwards',
              textShadow: '0 2px 20px rgba(255,215,0,0.3)',
            }}
          >
            Sangsom Kindergarten
          </h1>

          {/* Thai text styling (using English as placeholder) */}
          <p
            className="text-3xl font-semibold text-amber-600 animate-in slide-in-from-bottom-4 duration-700"
            style={{
              animationDelay: '0.6s',
              animationFillMode: 'backwards',
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            อนุบาลสงสม
          </p>

          {/* Decorative element */}
          <div
            className="flex justify-center gap-2 mt-6 animate-in fade-in duration-700"
            style={{
              animationDelay: '0.8s',
              animationFillMode: 'backwards',
            }}
          >
            {['🌟', '✨', '🌟'].map((emoji, i) => (
              <span
                key={i}
                className="text-2xl"
                style={{
                  animation: `twinkle ${1.5 + i * 0.3}s ease-in-out infinite`,
                  animationDelay: `${i * 0.2}s`,
                }}
              >
                {emoji}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Inline keyframe animations */}
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
      `}</style>
    </div>
  )
})

WelcomeScreen.displayName = 'WelcomeScreen'
