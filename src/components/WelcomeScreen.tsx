import { memo, startTransition, useCallback, useEffect, useState } from 'react'
import { preloadResources } from '../lib/resource-preloader'
import { soundManager } from '../lib/sound-manager'

interface WelcomeScreenProps {
  onComplete: () => void
}

type AudioPhase = 1 | 2 | 3 | null

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
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
 * 3. "Learning through playing for everyone!" (Thai male, ~3s)
 * 
 * @component
 */
export const WelcomeScreen = memo(({ onComplete }: WelcomeScreenProps) => {
  const [fadeOut, setFadeOut] = useState(false)
  const [currentPhase, setCurrentPhase] = useState<AudioPhase>(null)
  const [backgroundGradient, setBackgroundGradient] = useState('linear-gradient(45deg, #f59e0b, #fbbf24, #f97316)')
  const canvasRef = useRef<HTMLCanvasElement>(null)
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
    },
    3: {
      english: '',
      thai: 'การเรียนรู้ผ่านการเล่นสำหรับทุกคน!',
      school: '',
      fontFamily: 'Sarabun, "Noto Sans Thai", Tahoma, sans-serif'
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
      { url: '/sounds/welcome_learning_thai.wav', type: 'audio', priority: 'high' },
    ])

    const playSequentialAudio = async () => {
      try {
        // Phase 1: Play "In association with SANGSOM Kindergarten" (intellectual voice)
        setCurrentPhase(1)
        setBackgroundGradient('linear-gradient(45deg, #f59e0b, #fbbf24, #f97316)')
        await soundManager.playSound('welcome_association')

        // Wait for first audio to complete (~3 seconds)
        await new Promise(resolve => setTimeout(resolve, 3000))

        // Phase 2: Play "Learning through games for everyone!" (children's choir)
        setCurrentPhase(2)
        setBackgroundGradient('linear-gradient(45deg, #3b82f6, #8b5cf6, #ec4899)')
        // Trigger particle burst
        const canvas = canvasRef.current
        if (canvas) {
          canvas.width = window.innerWidth
          canvas.height = window.innerHeight
          const ctx = canvas.getContext('2d')
          if (ctx) {
            const particles: Particle[] = []
            for (let i = 0; i < 60; i++) {
              const angle = (i / 60) * Math.PI * 2
              particles.push({
                x: canvas.width / 2,
                y: canvas.height / 2,
                vx: Math.cos(angle) * (Math.random() * 3 + 1),
                vy: Math.sin(angle) * (Math.random() * 3 + 1),
                life: 1,
                color: ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316'][i % 4]
              })
            }
            const animate = () => {
              ctx.clearRect(0, 0, canvas.width, canvas.height)
              particles.forEach(p => {
                p.x += p.vx
                p.y += p.vy
                p.vy += 0.1
                p.life -= 0.01
                if (p.life > 0) {
                  ctx.globalAlpha = p.life
                  ctx.fillStyle = p.color
                  ctx.beginPath()
                  ctx.arc(p.x, p.y, 2, 0, Math.PI * 2)
                  ctx.fill()
                }
              })
              if (particles.some(p => p.life > 0)) {
                requestAnimationFrame(animate)
              }
            }
            requestAnimationFrame(animate)
          }
        }
        await soundManager.playSound('welcome_learning')

        // Wait for second audio to complete (~3 seconds)
        await new Promise(resolve => setTimeout(resolve, 3000))

        // Phase 3: Play "Learning through playing for everyone!" (Thai male)
        setCurrentPhase(3)
        await soundManager.playSound('welcome_learning_thai')

        // Wait for third audio to complete (~3 seconds)
        await new Promise(resolve => setTimeout(resolve, 3000))

        // Start fade-out
        setCurrentPhase(null)
        setFadeOut(true)

        // Complete after fade-out animation
        await new Promise(resolve => setTimeout(resolve, 500))
        onComplete()
      } catch (err) {
        if (import.meta.env.DEV) {
          console.log('[WelcomeScreen] Audio playback error:', err)
        }
        // Fallback: auto-dismiss after 9 seconds if audio fails
        // Text overlays will still be visible during fallback
        setTimeout(() => {
          setCurrentPhase(null)
          setFadeOut(true)
          setTimeout(onComplete, 500)
        }, 9000)
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
        perspective: '1200px',
        transformStyle: 'preserve-3d',
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          background: backgroundGradient,
          backgroundSize: '400% 400%',
          transition: 'background 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: 'translateZ(-30px)',
          animation: 'shimmer 1.5s ease-in-out infinite',
        }}
      />
      <img
        src={splashSrc}
        alt="Welcome"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ transform: 'translateZ(-20px)' }}
        onClick={skip}
      />

      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" style={{ transform: 'translateZ(5px)' }} />

      {/* Fallback text overlay - shows during each audio phase */}
      {currentPhase !== null && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
          style={{
            background: 'rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(8px)',
            animation: 'textFadeIn 0.3s ease-in',
            transform: 'translateZ(10px)',
          }}
        >
          <div
            className="backdrop-blur-xl bg-white/20 rounded-3xl p-8 shadow-2xl border border-white/30 text-center"
            style={{
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

        @keyframes shimmer {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        @keyframes letterReveal {
          0% {
            opacity: 0;
            transform: translateY(20px) rotateX(-90deg);
          }
          100% {
            opacity: 1;
            transform: translateY(0) rotateX(0deg);
          }
        }

        @keyframes starTwinkle {
          0%, 100% {
            opacity: 1;
            transform: scale(1) rotate(0deg);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.3) rotate(180deg);
          }
        }

        @keyframes rayPulse {
          0%, 100% {
            opacity: 0.7;
            transform: scaleY(1);
          }
          50% {
            opacity: 0.9;
            transform: scaleY(1.2);
          }
        }

        @keyframes floatSparkle {
          0%, 100% {
            transform: translateY(0) scale(1);
            opacity: 0.8;
          }
          25% {
            transform: translateY(-20px) scale(1.1);
            opacity: 1;
          }
          50% {
            transform: translateY(-30px) scale(0.9);
            opacity: 0.6;
          }
          75% {
            transform: translateY(-15px) scale(1.05);
            opacity: 0.9;
          }
        }

        @keyframes cardBounce {
          0% {
            opacity: 0;
            transform: translateZ(20px) scale(0.5) rotateY(-90deg);
          }
          60% {
            opacity: 1;
            transform: translateZ(20px) scale(1.08) rotateY(5deg);
          }
          80% {
            transform: translateZ(20px) scale(0.97) rotateY(-3deg);
          }
          100% {
            transform: translateZ(20px) scale(1) rotateY(0deg);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.6;
          }
        }
      `}</style>
    </div >
  )
})

WelcomeScreen.displayName = 'WelcomeScreen'
