import { memo, useMemo } from 'react'
import { UI_LAYER_MATRIX } from '../lib/constants/ui-layer-matrix'
import { multiTouchHandler } from '../lib/touch-handler'
import type { GameObject } from '../types/game'

interface FallingObjectProps {
  object: GameObject
  onTap: (objectId: string, playerSide: 'left' | 'right') => void
  playerSide: 'left' | 'right'
}

/**
 * FallingObject - Optimized interactive game object for touch devices
 * 
 * Performance optimizations (Jan 2026):
 * - Removed useState for hover (kindergarten kids use touch, not mouse)
 * - Simplified willChange usage
 * - Reduced style complexity for better 60fps performance
 * - Multi-touch validation for tablets
 * 
 * @component
 */
export const FallingObject = memo(({ object, onTap, playerSide }: FallingObjectProps) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Use multi-touch handler for debouncing and validation
    const shouldProcess = multiTouchHandler.handleMouseClick(object.id)
    if (shouldProcess) {
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
      onTap(object.id, playerSide)
    }
  }

  // Memoize style calculations to prevent recalculation on every render
  // Performance optimization: Use translate3d for GPU acceleration and isolate scale to font-size
  // to prevent composition layer recalculation from CSS variable changes
  const objectStyle = useMemo(() => ({
    left: `${object.x}%`,
    top: 0,
    transform: `translate3d(-50%, ${object.y}px, 0)`,
    fontSize: `calc(${object.size}px * var(--object-scale, 1))`,
    lineHeight: 1,
    zIndex: UI_LAYER_MATRIX.GAMEPLAY_OBJECTS,
  }), [object.x, object.y, object.size])

  // Detect object types for styling
  const isLetter = /^[A-Za-z]$/.test(object.emoji)
  const isNumericText = /^\d+$/.test(object.emoji)

  return (
    <div
      data-testid="falling-object"
      data-emoji={object.emoji}
      data-object-id={object.id}
      className="absolute cursor-pointer select-none"
      style={objectStyle}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      role="button"
      aria-label={`Tap ${object.emoji}`}
      tabIndex={0}
    >
      <div
        className={isNumericText
          ? 'font-bold text-blue-600 bg-white/90 rounded-lg px-2 py-1 shadow-lg'
          : 'drop-shadow-2xl'
        }
        style={{
          filter: isNumericText
            ? 'none'
            : isLetter
              ? undefined
              : 'drop-shadow(0 4px 8px rgba(0,0,0,0.25))',
          boxShadow: isNumericText
            ? '0 2px 8px rgba(59, 130, 246, 0.4)'
            : undefined,

          background: isNumericText
            ? 'rgba(255, 255, 255, 0.95)'
            : undefined,
          border: isNumericText ? '2px solid transparent' : undefined,
          backfaceVisibility: 'hidden',
        }}
      >
        {object.emoji}
      </div>
    </div>
  )
})

FallingObject.displayName = 'FallingObject'


