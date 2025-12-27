import { memo, startTransition, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { preloadResources } from '../../lib/resource-preloader'
import { soundManager } from '../../lib/sound-manager'
import { AnimatedText } from './AnimatedText'
import { SunLogo } from './SunLogo'

// TODO: [OPTIMIZATION] Split WelcomeScreen into smaller components (SunLogo, AnimatedText, ParticleSystem) for better maintainability

interface WelcomeScreenProps {
  onComplete: () => void
}

/**
 * Floating particle definition for ambient effects
 */
interface FloatingParticle {
  x: number
  y: number
  size: number
  delay: number
  duration: number
  color: string
}

/**
 * Fish sprite definition for animated school-of-fish effect
 */
interface FishSprite {
  top: number
  size: number
  duration: number
  delay: number
  direction: 'left' | 'right'
  opacity: number
  color: {
    primary: string
    secondary: string
    tail: string
  }
  id?: string
}

/**
 * WelcomeScreen - Premium splash screen for Lalitaporn Kindergarten partnership
 * 
 * Features:
 * - Sequential audio: intellectual voice → children's choir
 * - Dynamic text phases synced with audio
 * - Inspired by Lalitaporn's modern architecture and sun branding
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
 * 1. "In association with LALITAPORN Kindergarten" (intellectual voice, ~3s)
 * 2. "Learning through games for everyone!" (children's choir, ~3s)
 * 3. "Learning through playing for everyone!" (Thai male, ~3s)
 * 
 * @component
 */
export const WelcomeScreen = memo(({ onComplete }: WelcomeScreenProps) => {
  const [fadeOut, setFadeOut] = useState(false)
  const [audioPhase, setAudioPhase] = useState<'intro' | 'tagline'>('intro')
  const [showTagline, setShowTagline] = useState(false)
  const [showSkip, setShowSkip] = useState(false)
  const [showLoadingSkeleton, setShowLoadingSkeleton] = useState(true)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // Use the new Sangsom welcome image when present in /public.
  // Controlled by Vite env var: VITE_USE_SANGSOM_SPLASH ("true"/"false"), defaults to true.
  const useSangsomSplash =
    typeof import.meta !== 'undefined' && typeof import.meta.env !== 'undefined'
      ? import.meta.env.VITE_USE_SANGSOM_SPLASH !== 'false'
      : true

  // Precompute fish sprites so they animate independently without re-renders
  // Fixed: All fish now flow right with natural sine wave motion, no retarded left-right
  const fishSchool = useMemo<FishSprite[]>(
    () =>
      [
        // Blue fish (increased visibility with glow trails)
        { top: 10, size: 60, duration: 14, delay: 0.3, direction: 'right' as const, opacity: 0.85, color: { primary: 'rgba(59,130,246,1)', secondary: 'rgba(59,130,246,0.3)', tail: 'rgba(14,165,233,1)' } },
        { top: 20, size: 52, duration: 16, delay: 1.2, direction: 'right' as const, opacity: 0.75, color: { primary: 'rgba(59,130,246,1)', secondary: 'rgba(59,130,246,0.3)', tail: 'rgba(14,165,233,1)' } },
        { top: 68, size: 56, duration: 15, delay: 0.8, direction: 'right' as const, opacity: 0.8, color: { primary: 'rgba(96,165,250,1)', secondary: 'rgba(96,165,250,0.3)', tail: 'rgba(59,130,246,1)' } },
        { top: 88, size: 48, duration: 17, delay: 2.0, direction: 'right' as const, opacity: 0.7, color: { primary: 'rgba(59,130,246,1)', secondary: 'rgba(59,130,246,0.3)', tail: 'rgba(96,165,250,1)' } },

        // Purple/Violet fish (enhanced visibility)
        { top: 15, size: 58, duration: 13, delay: 0.5, direction: 'right' as const, opacity: 0.8, color: { primary: 'rgba(139,92,246,1)', secondary: 'rgba(139,92,246,0.3)', tail: 'rgba(167,139,250,1)' } },
        { top: 52, size: 50, duration: 17, delay: 1.5, direction: 'right' as const, opacity: 0.75, color: { primary: 'rgba(167,139,250,1)', secondary: 'rgba(167,139,250,0.3)', tail: 'rgba(139,92,246,1)' } },
        { top: 76, size: 54, duration: 14, delay: 0.4, direction: 'right' as const, opacity: 0.78, color: { primary: 'rgba(124,58,237,1)', secondary: 'rgba(124,58,237,0.3)', tail: 'rgba(139,92,246,1)' } },
        { top: 92, size: 46, duration: 16, delay: 2.2, direction: 'right' as const, opacity: 0.72, color: { primary: 'rgba(139,92,246,1)', secondary: 'rgba(139,92,246,0.3)', tail: 'rgba(167,139,250,1)' } },

        // Pink/Rose fish (vivid colors)
        { top: 25, size: 48, duration: 15, delay: 1.0, direction: 'right' as const, opacity: 0.82, color: { primary: 'rgba(244,114,182,1)', secondary: 'rgba(244,114,182,0.3)', tail: 'rgba(251,207,232,1)' } },
        { top: 60, size: 62, duration: 13, delay: 0.6, direction: 'right' as const, opacity: 0.78, color: { primary: 'rgba(236,72,153,1)', secondary: 'rgba(236,72,153,0.3)', tail: 'rgba(244,114,182,1)' } },
        { top: 82, size: 50, duration: 16, delay: 1.8, direction: 'right' as const, opacity: 0.76, color: { primary: 'rgba(236,72,153,1)', secondary: 'rgba(236,72,153,0.3)', tail: 'rgba(251,207,232,1)' } },

        // Orange/Amber fish (warm tones)
        { top: 32, size: 56, duration: 16, delay: 1.3, direction: 'right' as const, opacity: 0.8, color: { primary: 'rgba(251,146,60,1)', secondary: 'rgba(251,146,60,0.3)', tail: 'rgba(253,186,116,1)' } },
        { top: 45, size: 64, duration: 14, delay: 0.2, direction: 'right' as const, opacity: 0.85, color: { primary: 'rgba(249,115,22,1)', secondary: 'rgba(249,115,22,0.3)', tail: 'rgba(251,146,60,1)' } },
        { top: 70, size: 52, duration: 15, delay: 2.1, direction: 'right' as const, opacity: 0.77, color: { primary: 'rgba(251,146,60,1)', secondary: 'rgba(251,146,60,0.3)', tail: 'rgba(253,186,116,1)' } },

        // Teal/Cyan fish (vibrant blues)
        { top: 38, size: 50, duration: 15, delay: 1.7, direction: 'right' as const, opacity: 0.8, color: { primary: 'rgba(20,184,166,1)', secondary: 'rgba(20,184,166,0.3)', tail: 'rgba(45,212,191,1)' } },
        { top: 84, size: 54, duration: 13, delay: 0.9, direction: 'right' as const, opacity: 0.75, color: { primary: 'rgba(6,182,212,1)', secondary: 'rgba(6,182,212,0.3)', tail: 'rgba(34,211,238,1)' } },
        { top: 55, size: 48, duration: 17, delay: 2.3, direction: 'right' as const, opacity: 0.73, color: { primary: 'rgba(20,184,166,1)', secondary: 'rgba(20,184,166,0.3)', tail: 'rgba(45,212,191,1)' } },

        // Green/Emerald fish (natural greens)
        { top: 5, size: 46, duration: 17, delay: 1.4, direction: 'right' as const, opacity: 0.78, color: { primary: 'rgba(16,185,129,1)', secondary: 'rgba(16,185,129,0.3)', tail: 'rgba(52,211,153,1)' } },
        { top: 48, size: 58, duration: 14, delay: 0.7, direction: 'right' as const, opacity: 0.82, color: { primary: 'rgba(5,150,105,1)', secondary: 'rgba(5,150,105,0.3)', tail: 'rgba(16,185,129,1)' } },
        { top: 95, size: 52, duration: 16, delay: 1.9, direction: 'right' as const, opacity: 0.74, color: { primary: 'rgba(16,185,129,1)', secondary: 'rgba(16,185,129,0.3)', tail: 'rgba(52,211,153,1)' } },

        // Additional colorful fish for fuller effect
        { top: 12, size: 44, duration: 15, delay: 2.5, direction: 'right' as const, opacity: 0.7, color: { primary: 'rgba(251,146,60,1)', secondary: 'rgba(251,146,60,0.3)', tail: 'rgba(253,186,116,1)' } },
        { top: 64, size: 60, duration: 14, delay: 1.1, direction: 'right' as const, opacity: 0.8, color: { primary: 'rgba(244,114,182,1)', secondary: 'rgba(244,114,182,0.3)', tail: 'rgba(251,207,232,1)' } },
        { top: 28, size: 50, duration: 16, delay: 0.4, direction: 'right' as const, opacity: 0.75, color: { primary: 'rgba(6,182,212,1)', secondary: 'rgba(6,182,212,0.3)', tail: 'rgba(34,211,238,1)' } },
        { top: 42, size: 56, duration: 13, delay: 1.6, direction: 'right' as const, opacity: 0.82, color: { primary: 'rgba(124,58,237,1)', secondary: 'rgba(124,58,237,0.3)', tail: 'rgba(167,139,250,1)' } },
        { top: 78, size: 48, duration: 17, delay: 0.8, direction: 'right' as const, opacity: 0.76, color: { primary: 'rgba(5,150,105,1)', secondary: 'rgba(5,150,105,0.3)', tail: 'rgba(52,211,153,1)' } },
      ].map((item, idx) => ({ ...item, id: `fish-${idx}` })),
    []
  )

  // Floating ambient particles (sparkles and bubbles)
  // Using seeded values to maintain React 19 purity rules
  const floatingParticles = useMemo<FloatingParticle[]>(() => {
    const particles: FloatingParticle[] = []
    const colors = [
      'rgba(255,223,0,0.6)',
      'rgba(255,255,255,0.7)',
      'rgba(147,197,253,0.5)',
      'rgba(196,181,253,0.5)',
      'rgba(251,207,232,0.5)',
    ]

    // Use deterministic pseudo-random values based on index
    for (let i = 0; i < 30; i++) {
      // Simple seeded pseudo-random using index
      const seed1 = (i * 2654435761) % 2147483647
      const seed2 = (i * 1103515245 + 12345) % 2147483647
      const seed3 = (i * 48271) % 2147483647
      const seed4 = (i * 69621) % 2147483647
      const seed5 = (i * 134775813) % 2147483647

      particles.push({
        x: (seed1 / 2147483647) * 100,
        y: (seed2 / 2147483647) * 100,
        size: (seed3 / 2147483647) * 8 + 4,
        delay: (seed4 / 2147483647) * 5,
        duration: (seed5 / 2147483647) * 8 + 12,
        color: colors[i % 5],
      })
    }
    return particles
  }, [])

  const skip = useCallback(() => {
    // Stop any ongoing audio and dismiss quickly
    soundManager.stopAllAudio()
    startTransition(() => setFadeOut(true))
    setTimeout(onComplete, 350)
  }, [onComplete])

  // Particle burst effect on phase transition
  useEffect(() => {
    if (!showTagline || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    // Create particle burst
    const particles: Array<{ x: number, y: number, vx: number, vy: number, life: number, color: string, size: number }> = []
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2

    for (let i = 0; i < 60; i++) {
      const angle = (Math.PI * 2 * i) / 60
      const speed = Math.random() * 3 + 2
      particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        color: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'][Math.floor(Math.random() * 4)],
        size: Math.random() * 4 + 2,
      })
    }

    let animationId: number
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particles.forEach((p) => {
        p.life -= 0.015

        if (p.life > 0) {
          ctx.globalAlpha = p.life
          ctx.fillStyle = p.color
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
          ctx.fill()
        }
      })

      if (particles.some(p => p.life > 0)) {
        animationId = requestAnimationFrame(animate)
      }
    }

    animate()

    return () => {
      if (animationId) cancelAnimationFrame(animationId)
    }
  }, [showTagline])

  useEffect(() => {
    // Preload welcome audio to avoid first-play jank (metadata only)
    void preloadResources([
      { url: '/sounds/welcome_association.wav', type: 'audio', priority: 'high' },
      { url: '/sounds/welcome_learning.wav', type: 'audio', priority: 'high' },
      { url: '/sounds/welcome_learning_thai.wav', type: 'audio', priority: 'high' },
    ]).then(() => {
      // Hide loading skeleton after preload completes
      setShowLoadingSkeleton(false)
    }).catch(() => {
      // Hide skeleton even on error
      setShowLoadingSkeleton(false)
    })

    // Reveal Skip after a short moment
    const skipTimer = setTimeout(() => setShowSkip(true), 1000)

    const playSequentialAudio = async () => {
      try {
        // Phase 1: Play "In association with LALITAPORN Kindergarten" (intellectual voice)
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

        // Phase 3: Play "Learning through playing for everyone!" (Thai male)
        await soundManager.playSound('welcome_learning_thai')

        // Wait for third audio to complete (~3 seconds)
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
        // Fallback: auto-dismiss after 9 seconds if audio fails
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

  return (
    <div
      className={`fixed inset-0 z-100 flex items-center justify-center transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'
        }`}
      style={{
        animation: fadeOut ? 'fadeOut 0.5s ease-out' : 'fadeIn 0.5s ease-in',
        perspective: '1200px',
        background: audioPhase === 'intro'
          ? 'linear-gradient(135deg, #fef3c7 0%, #fed7aa 25%, #fdba74 50%, #fb923c 75%, #f97316 100%)'
          : 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 20%, #c7d2fe 40%, #e9d5ff 60%, #fbcfe8 80%, #fce7f3 100%)',
        backgroundSize: '400% 400%',
        backgroundPosition: audioPhase === 'intro' ? '0% 50%' : '100% 50%',
        transition: 'background-position 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* Particle burst canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 50 }}
      />

      {/* Optional: full-screen welcome image (add /welcome-sangsom.png to public/) */}
      {useSangsomSplash && (
        <img
          src="/welcome-sangsom.png"
          alt="Sangsom Kindergarten welcome"
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{ zIndex: 1, opacity: 0.98 }}
        />
      )}

      {/* Skip control (appears after a short delay) */}
      {showSkip && (
        <button
          type="button"
          onClick={skip}
          className="absolute top-4 left-4 rounded-full px-4 py-2 text-sm font-semibold bg-white/90 backdrop-blur-sm text-gray-800 shadow-lg hover:bg-white hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all duration-300"
          aria-label="Skip welcome"
          style={{
            zIndex: 100,
          }}
        >
          Skip
        </button>
      )}

      {/* Ambient floating particles (sparkles and bubbles) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 5 }}>
        {floatingParticles.map((particle, i) => (
          <div
            key={`particle-${i}`}
            className="absolute rounded-full"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              background: particle.color,
              boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
              animation: `floatSparkle ${particle.duration}s ease-in-out ${particle.delay}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Ambient fish/sprite layer */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 10 }}>
        {fishSchool.map((fish, index) => (
          <div
            key={fish.id}
            className="absolute"
            style={{
              top: `${fish.top}%`,
              left: fish.direction === 'right' ? '-15%' : '115%',
              filter: 'blur(0px)', // Removed blur for crisp visibility
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
                background: `radial-gradient(circle at 30% 40%, ${fish.color.primary}, ${fish.color.secondary} 60%)`,
                boxShadow: `0 0 25px ${fish.color.primary}, 0 0 40px ${fish.color.secondary}, 0 0 60px ${fish.color.secondary}`, // Enhanced glow trail
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
                  background: `radial-gradient(circle, ${fish.color.tail}, ${fish.color.secondary} 70%)`,
                  filter: 'blur(0.5px)', // Reduced blur on tail
                  boxShadow: `0 0 15px ${fish.color.tail}`, // Added glow to tail
                }}
              />
            </span>
          </div>
        ))}
      </div>

      {/* Main content container with 3D perspective */}
      <div
        className="text-center px-8 animate-in zoom-in duration-700"
        style={{
          transformStyle: 'preserve-3d',
          zIndex: 20,
        }}
      >
        {/* Sun Logo - extracted into component */}
        <SunLogo phase={audioPhase} />



        {/* Dynamic text content with glassmorphism - changes with audio phase */}
        <div
          className="space-y-6 min-h-[300px] flex flex-col justify-center"
          style={{
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Subtle loading skeleton during audio preload */}
          {showLoadingSkeleton && (
            <div className="animate-pulse flex flex-col items-center space-y-4">
              <div className="h-8 bg-white/20 rounded w-32"></div>
              <div className="h-4 bg-white/10 rounded w-24"></div>
            </div>
          )}
          {/* Phase 1: Partnership Introduction with glassmorphism card */}
          <AnimatedText audioPhase={audioPhase} showTagline={showTagline} />
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

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.6;
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

        @keyframes swimRight {
          0% {
            transform: translateX(-10%) translateY(0);
          }
          25% {
            transform: translateX(22.5vw) translateY(8px);
          }
          50% {
            transform: translateX(55vw) translateY(0);
          }
          75% {
            transform: translateX(87.5vw) translateY(-8px);
          }
          100% {
            transform: translateX(120vw) translateY(0);
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

        /* Accessibility: reduce motion when user prefers */
        @media (prefers-reduced-motion: reduce) {
          .animate-in, .animate-out { animation: none !important; }
          * { transition: none !important; }
          /* Disable decorative layers */
          .pointer-events-none > div { animation: none !important; }
        }
      `}</style>
    </div >
  )
})

WelcomeScreen.displayName = 'WelcomeScreen'
