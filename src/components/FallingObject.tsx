import { memo, useMemo } from 'react'
import { GameObject } from '../hooks/use-game-logic'
import { multiTouchHandler } from '../lib/touch-handler'

interface FallingObjectProps {
  object: GameObject
  onTap: (objectId: string, playerSide: 'left' | 'right') => void
  playerSide: 'left' | 'right'
}

export const FallingObject = memo(({ object, onTap, playerSide }: FallingObjectProps) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Use multi-touch handler for debouncing and validation
    const shouldProcess = multiTouchHandler.handleMouseClick(object.id)
    if (shouldProcess) {
      // Removed tap sound - only target pronunciations allowed
      onTap(object.id, playerSide)
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Register touch start with multi-touch handler
    multiTouchHandler.handleTouchStart(e.nativeEvent, object.id)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Validate and process touch end with multi-touch handler
    const shouldProcess = multiTouchHandler.handleTouchEnd(e.nativeEvent, object.id)
    if (shouldProcess) {
      // Removed tap sound - only target pronunciations allowed
      onTap(object.id, playerSide)
    }
  }

  // Memoize style calculations to prevent recalculation on every render
  const objectStyle = useMemo(() => ({
    left: `${object.x}%`,
    transform: `translateY(${object.y}px) scale(var(--object-scale, 1))`,
    fontSize: `${object.size}px`,
    lineHeight: 1,
    zIndex: 10
  }), [object.x, object.y, object.size])

  // Check if the emoji is actually a number (for numbers >9)
  const isNumericText = /^\d+$/.test(object.emoji)

  return (
    <div
      className="absolute cursor-pointer select-none transition-all duration-100 will-change-transform hover:scale-125 active:scale-95"
      style={objectStyle}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className={`transition-all duration-150 ${isNumericText ? 'font-bold text-blue-600 bg-white/90 rounded-lg px-2 py-1 shadow-lg' : 'drop-shadow-2xl'}`}
        style={{
          filter: isNumericText ? 'none' : 'drop-shadow(0 4px 8px rgba(0,0,0,0.25))'
        }}>
        {object.emoji}
      </div>
    </div>
  )
}, (prevProps, nextProps) => {
  // Custom comparison function for better memoization
  return (
    prevProps.object.id === nextProps.object.id &&
    prevProps.object.x === nextProps.object.x &&
    prevProps.object.y === nextProps.object.y &&
    prevProps.playerSide === nextProps.playerSide
  )
})