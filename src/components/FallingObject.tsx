import { memo, useMemo, useState } from 'react'
import { GameObject } from '../hooks/use-game-logic'
import { multiTouchHandler } from '../lib/touch-handler'

interface FallingObjectProps {
  object: GameObject
  onTap: (objectId: string, playerSide: 'left' | 'right') => void
  playerSide: 'left' | 'right'
}

/**
 * FallingObject - Production-grade interactive game object
 * 
 * Features premium UX enhancements (2025 best practices):
 * - Smooth transform-based hover states (60fps)
 * - Tactile feedback with spring animations
 * - Optimized performance with memoization
 * - Multi-touch validation for tablets
 * - Accessible interaction patterns
 * 
 * @component
 */
export const FallingObject = memo(({ object, onTap, playerSide }: FallingObjectProps) => {
  // Track hover state for micro-interactions (must be declared before any logic)
  const [isHovered, setIsHovered] = useState(false)

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
  // Using transform/opacity for GPU-accelerated 60fps performance
  const objectStyle = useMemo(() => ({
    left: `${object.x}%`,
    top: 0,
    transform: `translate(-50%, ${object.y}px) scale(var(--object-scale, 1))`,
    fontSize: `${object.size}px`,
    lineHeight: 1,
    zIndex: 10,
    // Hardware acceleration hint for smooth animations
    willChange: 'transform',
  }), [object.x, object.y, object.size])

  // Check if the emoji is actually a number (for numbers >9)
  const isNumericText = /^\d+$/.test(object.emoji)

  return (
    <div
      data-testid="falling-object"
      data-emoji={object.emoji}
      data-object-id={object.id}
      className="absolute cursor-pointer select-none will-change-transform"
      style={objectStyle}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      aria-label={`Tap ${object.emoji}`}
      tabIndex={0}
    >
      <div 
        className={`transition-all duration-150 ease-out ${
          isNumericText 
            ? 'font-bold text-blue-600 bg-white/90 rounded-lg px-2 py-1 shadow-lg' 
            : 'drop-shadow-2xl'
        }`}
        style={{
          filter: isNumericText 
            ? 'none' 
            : 'drop-shadow(0 4px 8px rgba(0,0,0,0.25))',
          // Spring-based hover animation for premium feel
          transform: isHovered 
            ? 'scale(1.15) translateY(-2px)' 
            : 'scale(1)',
          // Subtle glow on hover
          boxShadow: isHovered && isNumericText
            ? '0 8px 24px rgba(37, 99, 235, 0.3)'
            : undefined,
          // Smooth transition with custom cubic-bezier for spring effect
          transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
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