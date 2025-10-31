import { memo, useCallback, useEffect, useRef, useState } from 'react'

interface Worm {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  alive: boolean
  angle: number
  wigglePhase: number
}

interface Splat {
  id: number
  x: number
  y: number
  createdAt: number
}

const WORM_COUNT = 5
const WORM_SIZE = 60
const BASE_SPEED = 1.5
const SPLAT_DURATION = 10000 // 10 seconds
const SPEED_INCREASE_FACTOR = 1.2

// Initialize worms function
const createInitialWorms = (): Worm[] => {
  return Array.from({ length: WORM_COUNT }, (_, i) => ({
    id: i,
    x: Math.random() * 80 + 10, // 10-90% of screen width
    y: Math.random() * 80 + 10, // 10-90% of screen height
    vx: (Math.random() - 0.5) * BASE_SPEED * 2,
    vy: (Math.random() - 0.5) * BASE_SPEED * 2,
    alive: true,
    angle: Math.random() * Math.PI * 2,
    wigglePhase: Math.random() * Math.PI * 2
  }))
}

export const WormLoadingScreen = memo(({ onComplete }: { onComplete: () => void }) => {
  const [worms, setWorms] = useState<Worm[]>(createInitialWorms)
  const [splats, setSplats] = useState<Splat[]>([])
  const [speedMultiplier, setSpeedMultiplier] = useState(1)
  const [currentTime, setCurrentTime] = useState(() => Date.now())
  const containerRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number>()
  const splatIdCounter = useRef(0)

  // Animation loop for worm movement
  useEffect(() => {
    const animate = () => {
      setWorms(prev => prev.map(worm => {
        if (!worm.alive) return worm

        const container = containerRef.current
        if (!container) return worm

        const containerWidth = container.clientWidth

        // Update position
        let newX = worm.x + (worm.vx * speedMultiplier) / 10
        let newY = worm.y + (worm.vy * speedMultiplier) / 10

        // Bounce off walls with percentage-based positioning
        let newVx = worm.vx
        let newVy = worm.vy
        const boundsMargin = (WORM_SIZE / containerWidth) * 100

        if (newX <= boundsMargin || newX >= 100 - boundsMargin) {
          newVx = -worm.vx
          newX = Math.max(boundsMargin, Math.min(100 - boundsMargin, newX))
        }

        if (newY <= boundsMargin || newY >= 100 - boundsMargin) {
          newVy = -worm.vy
          newY = Math.max(boundsMargin, Math.min(100 - boundsMargin, newY))
        }

        // Update wiggle phase for animation
        const newWigglePhase = worm.wigglePhase + 0.1

        // Update angle based on velocity direction
        const newAngle = Math.atan2(newVy, newVx)

        return {
          ...worm,
          x: newX,
          y: newY,
          vx: newVx,
          vy: newVy,
          angle: newAngle,
          wigglePhase: newWigglePhase
        }
      }))

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animationFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [speedMultiplier])

  // Remove splats after duration and update current time for opacity calculations
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      setCurrentTime(now)
      setSplats(prev => prev.filter(splat => now - splat.createdAt < SPLAT_DURATION))
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Check if all worms are destroyed and complete loading
  useEffect(() => {
    const aliveCount = worms.filter(w => w.alive).length
    if (worms.length > 0 && aliveCount === 0) {
      // Small delay before completing to show final splat
      const timer = setTimeout(() => {
        onComplete()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [worms, onComplete])

  const handleWormClick = useCallback((wormId: number, event: React.MouseEvent | React.TouchEvent) => {
    event.preventDefault()
    event.stopPropagation()

    setWorms(prev => {
      const worm = prev.find(w => w.id === wormId)
      if (!worm || !worm.alive) return prev

      // Create splat at worm position
      setSplats(prevSplats => [
        ...prevSplats,
        {
          id: splatIdCounter.current++,
          x: worm.x,
          y: worm.y,
          createdAt: Date.now()
        }
      ])

      // Mark worm as dead
      const updatedWorms = prev.map(w =>
        w.id === wormId ? { ...w, alive: false } : w
      )

      // Increase speed for remaining worms
      const aliveCount = updatedWorms.filter(w => w.alive).length
      if (aliveCount > 0) {
        setSpeedMultiplier(prevSpeed => prevSpeed * SPEED_INCREASE_FACTOR)
      }

      return updatedWorms
    })
  }, [])

  const aliveWorms = worms.filter(w => w.alive)

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-gradient-to-br from-green-50 to-green-100 z-50 overflow-hidden"
      style={{ touchAction: 'none' }}
    >
      {/* Loading message */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 text-center">
        <h2 className="text-3xl font-bold text-green-800 mb-2">
          🐛 Catch the Worms! 🐛
        </h2>
        <p className="text-lg text-green-600">
          {aliveWorms.length > 0
            ? `${aliveWorms.length} worm${aliveWorms.length !== 1 ? 's' : ''} remaining...`
            : 'All caught! Starting game...'}
        </p>
      </div>

      {/* Worms */}
      {worms.map(worm => worm.alive && (
        <div
          key={worm.id}
          className="absolute cursor-pointer select-none transition-opacity duration-200 hover:scale-110"
          style={{
            left: `${worm.x}%`,
            top: `${worm.y}%`,
            fontSize: `${WORM_SIZE}px`,
            transform: `translate(-50%, -50%) rotate(${worm.angle}rad)`,
            willChange: 'transform',
            zIndex: 10
          }}
          onClick={(e) => handleWormClick(worm.id, e)}
          onTouchEnd={(e) => handleWormClick(worm.id, e)}
        >
          <div
            className="worm-wiggle"
            style={{
              animation: `wiggle 0.3s ease-in-out infinite`,
              animationDelay: `${worm.wigglePhase}s`,
              filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.25))'
            }}
          >
            🐛
          </div>
        </div>
      ))}

      {/* Splats */}
      {splats.map(splat => {
        const age = currentTime - splat.createdAt
        const opacity = Math.max(0, 1 - age / SPLAT_DURATION)

        return (
          <div
            key={splat.id}
            className="absolute pointer-events-none select-none"
            style={{
              left: `${splat.x}%`,
              top: `${splat.y}%`,
              fontSize: `${WORM_SIZE}px`,
              transform: 'translate(-50%, -50%)',
              opacity,
              transition: 'opacity 1s ease-out',
              zIndex: 5
            }}
          >
            💥
          </div>
        )
      })}

      {/* Skip button */}
      <button
        onClick={onComplete}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg shadow-lg transition-all hover:scale-105"
      >
        Skip Loading Screen
      </button>

      <style>{`
        @keyframes wiggle {
          0%, 100% {
            transform: translateY(0) scaleX(1);
          }
          25% {
            transform: translateY(-2px) scaleX(1.05);
          }
          50% {
            transform: translateY(0) scaleX(0.95);
          }
          75% {
            transform: translateY(2px) scaleX(1.05);
          }
        }
      `}</style>
    </div>
  )
})

WormLoadingScreen.displayName = 'WormLoadingScreen'
