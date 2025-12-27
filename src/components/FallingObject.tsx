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

  // Detect object types for enhanced animations
  const isLetter = /^[A-Za-z]$/.test(object.emoji)
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
        className={`transition-all duration-150 ease-out ${isNumericText
          ? 'font-bold text-blue-600 bg-white/90 rounded-lg px-2 py-1 shadow-lg'
          : 'drop-shadow-2xl'
          }`}
        style={{
          filter: isNumericText
            ? 'none'
            : isLetter
              ? undefined // Rainbow pulse applied via animation below
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
          // Rainbow pulsating animation for letters - DRAMATICALLY ENHANCED
          animation: isLetter
            ? 'rainbowPulse 1.8s ease-in-out infinite'
            : isNumericText
              ? 'gradientPulse 2s ease infinite'
              : undefined,
          // Gradient background for numbers - MORE VIBRANT
          background: isNumericText
            ? 'linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899, #f59e0b, #10b981, #3b82f6)'
            : undefined,
          backgroundSize: isNumericText ? '600% 600%' : undefined,
          // GPU acceleration
          willChange: (isLetter || isNumericText) ? 'filter, background-position' : 'transform',
          backfaceVisibility: 'hidden' as const,
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

FallingObject.displayName = 'FallingObject'

// Inline CSS animations for letters and numbers
// Using inline styles to keep component self-contained
if (typeof document !== 'undefined') {
  const styleId = 'falling-object-animations'
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = `
      /* Enhanced pulsating animation for alphabet (letters) */
      @keyframes rainbowPulse {
        0%, 100% {
          filter: hue-rotate(0deg) brightness(1.25) saturate(1.4) drop-shadow(0 6px 14px rgba(0,0,0,0.35));
          transform: scale(1);
          text-shadow: 0 2px 6px rgba(0,0,0,0.15);
        }
        16.67% {
          filter: hue-rotate(60deg) brightness(1.6) saturate(1.9) drop-shadow(0 10px 20px rgba(255,223,0,0.85));
          transform: scale(1.06);
        }
        33.33% {
          filter: hue-rotate(120deg) brightness(1.6) saturate(1.9) drop-shadow(0 10px 20px rgba(0,255,0,0.85));
          transform: scale(1.08);
        }
        50% {
          filter: hue-rotate(180deg) brightness(1.45) saturate(1.7) drop-shadow(0 10px 22px rgba(0,255,255,0.85));
          transform: scale(1.08);
        }
        66.67% {
          filter: hue-rotate(240deg) brightness(1.6) saturate(1.9) drop-shadow(0 10px 20px rgba(0,0,255,0.85));
          transform: scale(1.08);
        }
        83.33% {
          filter: hue-rotate(300deg) brightness(1.6) saturate(1.9) drop-shadow(0 10px 20px rgba(255,0,255,0.85));
          transform: scale(1.06);
        }
      }

      /* Enhanced gradient pulse for numeric (counting) clarity */
      @keyframes gradientPulse {
        0%, 100% {
          background-position: 0% 50%;
          transform: scale(1) rotate(0deg);
          box-shadow: 0 10px 36px rgba(59, 130, 246, 0.55);
        }
        25% {
          background-position: 40% 50%;
          transform: scale(1.04) rotate(2deg);
          box-shadow: 0 12px 40px rgba(139, 92, 246, 0.7);
        }
        50% {
          background-position: 100% 50%;
          transform: scale(1.1) rotate(0deg);
          box-shadow: 0 16px 48px rgba(236, 72, 153, 0.8);
        }
        75% {
          background-position: 60% 50%;
          transform: scale(1.04) rotate(-2deg);
          box-shadow: 0 12px 40px rgba(245, 158, 11, 0.7);
        }
      }
    `
    document.head.appendChild(style)
  }
}
