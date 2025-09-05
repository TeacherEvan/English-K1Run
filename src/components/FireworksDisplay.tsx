import { useEffect, useState } from 'react'

interface FireworksDisplayProps {
  isVisible: boolean
  winner: number | null
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

export function FireworksDisplay({ isVisible, winner }: FireworksDisplayProps) {
  const [fireworks, setFireworks] = useState<Firework[]>([])

  const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', '#eb4d4b', '#6c5ce7', '#a29bfe']

  const createFirework = (x: number, y: number): Firework => {
    const particles: Particle[] = []
    const particleCount = 25
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
  }

  const updateFireworks = () => {
    setFireworks(prev => 
      prev.map(firework => ({
        ...firework,
        particles: firework.particles
          .map(particle => ({
            ...particle,
            x: particle.x + particle.vx,
            y: particle.y + particle.vy,
            vy: particle.vy + 0.15, // gravity
            life: particle.life - 0.02
          }))
          .filter(particle => particle.life > 0)
      }))
      .filter(firework => firework.particles.length > 0)
    )
  }

  useEffect(() => {
    if (!isVisible) {
      setFireworks([])
      return
    }

    // Create initial burst of fireworks
    const initialFireworks = []
    for (let i = 0; i < 6; i++) {
      setTimeout(() => {
        const x = Math.random() * window.innerWidth
        const y = Math.random() * window.innerHeight * 0.6 + window.innerHeight * 0.1
        setFireworks(prev => [...prev, createFirework(x, y)])
      }, i * 200)
    }

    // Continue creating fireworks periodically
    const interval = setInterval(() => {
      const x = Math.random() * window.innerWidth
      const y = Math.random() * window.innerHeight * 0.6 + window.innerHeight * 0.1
      setFireworks(prev => [...prev, createFirework(x, y)])
    }, 800)

    // Animation loop
    const animationInterval = setInterval(updateFireworks, 16)

    return () => {
      clearInterval(interval)
      clearInterval(animationInterval)
    }
  }, [isVisible])

  if (!isVisible || !winner) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {/* Winner announcement */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center animate-bounce-in">
          <h1 className="text-8xl font-bold text-white drop-shadow-2xl mb-4 animate-pulse">
            🎉 PLAYER {winner} WINS! 🎉
          </h1>
          <div className="text-6xl animate-celebrate">
            🏆
          </div>
        </div>
      </div>

      {/* Fireworks particles */}
      <svg className="absolute inset-0 w-full h-full">
        {fireworks.map(firework =>
          firework.particles.map(particle => (
            <circle
              key={particle.id}
              cx={particle.x}
              cy={particle.y}
              r={Math.max(1, particle.life * 4)}
              fill={particle.color}
              opacity={particle.life}
              style={{
                filter: `drop-shadow(0 0 6px ${particle.color})`
              }}
            />
          ))
        )}
      </svg>

      {/* Confetti effect */}
      <div className="absolute inset-0">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="absolute animate-bounce"
            style={{
              left: `${Math.random() * 100}%`,
              top: `-10px`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          >
            <div
              className="w-3 h-3 rotate-45"
              style={{
                backgroundColor: colors[Math.floor(Math.random() * colors.length)],
                transform: `rotate(${Math.random() * 360}deg)`
              }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}