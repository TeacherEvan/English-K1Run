import { memo, useMemo } from 'react'
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
  const objectStyle = useMemo(() => ({
    left: `${object.x}%`,
    top: 0,
    transform: `translate(-50%, ${object.y}px) scale(var(--object-scale, 1))`,
    fontSize: `${object.size}px`,
    lineHeight: 1,
    zIndex: 10,
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
          animation: isLetter
            ? 'outlinePulseLetter 2s ease-in-out infinite'
            : isNumericText
              ? 'outlinePulseNumber 2s ease-in-out infinite'
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

// Inline CSS animations for letters and numbers
if (typeof document !== 'undefined') {
  const styleId = 'falling-object-animations'
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = `
      @keyframes outlinePulseLetter {
        0%, 100% {
          filter: drop-shadow(0 0 2px rgba(255, 255, 255, 0.8));
        }
        50% {
          filter: drop-shadow(0 0 8px rgba(255, 0, 255, 0.8)) drop-shadow(0 0 12px rgba(255, 0, 255, 0.4));
        }
      }
      @keyframes outlinePulseNumber {
        0%, 100% {
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
          transform: scale(1);
          border-color: rgba(59, 130, 246, 0.8);
        }
        50% {
          box-shadow: 0 0 0 6px rgba(59, 130, 246, 0.0), 0 0 0 12px rgba(59, 130, 246, 0.2);
          transform: scale(1.05);
          border-color: rgba(37, 99, 235, 1);
        }
      }
    `
    document.head.appendChild(style)
  }
}
