import { useCallback, useEffect, useState } from 'react'
import { playSoundEffect } from '../lib/sound-manager'

interface FireworksDisplayProps {
  isVisible: boolean
  winner: boolean
}

interface Firework {
  id: string
  x: number
  y: number
  color: string
  particles: Particle[]
}

interface Particle {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  color: string
  life: number
  maxLife: number
}

const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', '#eb4d4b', '#6c5ce7', '#a29bfe']

export function FireworksDisplay({ isVisible, winner }: FireworksDisplayProps) {
  const [fireworks, setFireworks] = useState<Firework[]>([])
  const [hasPlayedSticker, setHasPlayedSticker] = useState(false)

  // Generate confetti positions once to avoid Math.random() during render
  const [confettiElements] = useState(() =>
    Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      animationDuration: 3 + Math.random() * 2,
      animationDelay: Math.random() * 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360
    }))
  )

  const createFirework = useCallback((x: number, y: number): Firework => {
    const particles: Particle[] = []
    const particleCount = 20 // Reduced from 25 for performance
    const color = colors[Math.floor(Math.random() * colors.length)]

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount
      const velocity = Math.random() * 4 + 2

      particles.push({
        id: `particle-${i}-${Date.now()}`,
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        color,
        life: 1,
        maxLife: 1
      })
    }

    return {
      id: `firework-${Date.now()}-${Math.random()}`,
      x,
      y,
      color,
      particles
    }
  }, [])

  const updateFireworks = useCallback(() => {
    setFireworks(prev => {
      if (prev.length === 0) return prev
      
      const updated: Firework[] = []
      for (const firework of prev) {
        const particles = firework.particles
          .map(particle => ({
            ...particle,
            x: particle.x + particle.vx,
            y: particle.y + particle.vy,
            vy: particle.vy + 0.15, // gravity
            life: particle.life - 0.02
          }))
          .filter(particle => particle.life > 0)
        
        if (particles.length > 0) {
          updated.push({ ...firework, particles })
        }
      }
      
      return updated
    })
  }, [])

  // Clean up fireworks when not visible
  useEffect(() => {
    if (!isVisible) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFireworks([])
      setHasPlayedSticker(false)
    }
  }, [isVisible])

  // Play "GIVE THEM A STICKER!" voice when winner appears
  useEffect(() => {
    if (isVisible && winner && !hasPlayedSticker) {
      // Delay slightly to let fireworks start, then play the sticker voice
      const timer = setTimeout(() => {
        void playSoundEffect.sticker()
        setHasPlayedSticker(true)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [isVisible, winner, hasPlayedSticker])

  useEffect(() => {
    if (!isVisible) return

    // Create only 3 initial fireworks bursts (reduced for performance)
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        const x = Math.random() * window.innerWidth
        const y = Math.random() * window.innerHeight * 0.6 + window.innerHeight * 0.1
        setFireworks(prev => [...prev, createFirework(x, y)])
      }, i * 300)
    }

    let lastSpawnTime = Date.now()
    let animationFrameId: number

    // Use requestAnimationFrame for smooth 60fps animations
    const animate = () => {
      const currentTime = Date.now()

      // Spawn new firework every 1.5s
      if (currentTime - lastSpawnTime > 1500) {
        const x = Math.random() * window.innerWidth
        const y = Math.random() * window.innerHeight * 0.6 + window.innerHeight * 0.1
        setFireworks(prev => {
          // Limit max fireworks to prevent memory issues
          if (prev.length > 3) return prev
          return [...prev, createFirework(x, y)]
        })
        lastSpawnTime = currentTime
      }

      // Update fireworks positions
      updateFireworks()

      animationFrameId = requestAnimationFrame(animate)
    }

    animationFrameId = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [isVisible, createFirework, updateFireworks])

  if (!isVisible || !winner) return null

  return (
    <div data-testid="fireworks" className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {/* Winner announcement - simplified */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center bounce-in">
          <h1 className="text-6xl sm:text-7xl md:text-8xl font-bold text-white drop-shadow-2xl mb-4"
            style={{
              fontSize: `calc(4rem * var(--font-scale, 1))`,
              textShadow: '0 4px 8px rgba(0,0,0,0.5), 0 0 20px rgba(255,255,255,0.3)'
            }}>
            🎉 YOU WIN! 🎉
          </h1>
          <div className="text-5xl sm:text-6xl" style={{ fontSize: `calc(3rem * var(--font-scale, 1))` }}>
            🏆
          </div>
        </div>
      </div>

      {/* Fireworks particles - reduced */}
      <svg className="absolute inset-0 w-full h-full">
        {fireworks.map(firework =>
          firework.particles.map(particle => (
            <circle
              key={particle.id}
              cx={particle.x}
              cy={particle.y}
              r={Math.max(1, particle.life * 3)}
              fill={particle.color}
              opacity={particle.life * 0.8}
            />
          ))
        )}
      </svg>

      {/* Reduced confetti - only 20 elements instead of 50 */}
      <div className="absolute inset-0">
        {confettiElements.map((element) => (
          <div
            key={element.id}
            className="absolute"
            style={{
              left: `${element.left}%`,
              top: `-10px`,
              animation: `fall ${element.animationDuration}s linear ${element.animationDelay}s infinite`
            }}
          >
            <div
              className="w-2 h-2"
              style={{
                backgroundColor: element.color,
                transform: `rotate(${element.rotation}deg)`,
                opacity: 0.7
              }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}