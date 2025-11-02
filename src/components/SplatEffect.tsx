import { memo, useMemo } from 'react'

export interface SplatObject {
  id: string
  x: number
  y: number
  createdAt: number
  lane: 'left' | 'right'
}

interface SplatEffectProps {
  splat: SplatObject
  currentTime: number
}

const SPLAT_DURATION = 8000 // 8 seconds as per requirements
const SPLAT_SIZE = 80

export const SplatEffect = memo(({ splat, currentTime }: SplatEffectProps) => {
  const age = currentTime - splat.createdAt
  
  // Calculate opacity - fade from 1 to 0 over SPLAT_DURATION
  const opacity = useMemo(() => {
    return Math.max(0, 1 - age / SPLAT_DURATION)
  }, [age])

  const splatStyle = useMemo(() => ({
    left: `${splat.x}%`,
    top: `${splat.y}px`,
    fontSize: `${SPLAT_SIZE}px`,
    opacity,
    transform: 'translate(-50%, -50%) scale(1.2)',
    transition: 'opacity 0.5s ease-out',
    zIndex: 14 // Below worms (15) but above game objects (10)
  }), [splat.x, splat.y, opacity])

  // Don't render if opacity is 0
  if (opacity <= 0) return null

  return (
    <div
      className="absolute pointer-events-none select-none"
      style={splatStyle}
    >
      ❇️
    </div>
  )
}, (prevProps, nextProps) => {
  // Only re-render if the splat ID changed or if time difference is significant
  return (
    prevProps.splat.id === nextProps.splat.id &&
    Math.abs(prevProps.currentTime - nextProps.currentTime) < 100
  )
})

SplatEffect.displayName = 'SplatEffect'
