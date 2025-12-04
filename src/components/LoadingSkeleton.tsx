import { memo } from 'react'
import { cn } from '../lib/utils'

interface LoadingSkeletonProps {
  /** Variant of the loading skeleton */
  variant?: 'default' | 'worm' | 'fireworks' | 'achievement'
  /** Additional CSS classes */
  className?: string
}

/**
 * LoadingSkeleton - Production-grade loading state component
 * 
 * Provides engaging loading states with shimmer effects and micro-animations
 * following 2025 UX best practices for optimal perceived performance.
 * 
 * Features:
 * - Shimmer animations for premium feel
 * - Spring-based bounce animations
 * - Optimized for 60fps with transform/opacity
 * - Accessible loading indicators
 * 
 * @component
 * @example
 * <Suspense fallback={<LoadingSkeleton variant="worm" />}>
 *   <WormLoadingScreen />
 * </Suspense>
 */
export const LoadingSkeleton = memo(({ 
  variant = 'default',
  className 
}: LoadingSkeletonProps) => {
  if (variant === 'worm') {
    return (
      <div 
        className={cn(
          "h-screen w-screen flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20 transition-all duration-500",
          className
        )}
        role="status"
        aria-live="polite"
        aria-label="Loading game experience"
      >
        <div className="text-center space-y-4">
          {/* Enhanced worm animation with spring physics */}
          <div 
            className="text-6xl animate-bounce"
            style={{
              animation: 'bounce 1s ease-in-out infinite',
              filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))'
            }}
          >
            🐛
          </div>
          
          {/* Shimmer loading text with gradient animation */}
          <div className="relative overflow-hidden">
            <div 
              className="text-xl font-semibold text-primary"
              style={{
                background: 'linear-gradient(90deg, currentColor 0%, currentColor 40%, transparent 50%, currentColor 60%, currentColor 100%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 2s ease-in-out infinite',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Loading game...
            </div>
          </div>

          {/* Progress indicator dots */}
          <div className="flex justify-center gap-2 pt-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-primary/60"
                style={{
                  animation: `pulse 1.5s ease-in-out infinite`,
                  animationDelay: `${i * 0.2}s`
                }}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'fireworks') {
    return (
      <div 
        className={cn(
          "absolute inset-0 flex items-center justify-center pointer-events-none",
          className
        )}
        role="presentation"
        aria-hidden="true"
      >
        <div 
          className="text-8xl"
          style={{
            animation: 'pulse 1s ease-in-out infinite, scale 2s ease-in-out infinite',
            filter: 'drop-shadow(0 8px 24px rgba(255,215,0,0.4))'
          }}
        >
          🎆
        </div>
      </div>
    )
  }

  if (variant === 'achievement') {
    return (
      <div 
        className={cn(
          "absolute top-28 left-1/2 -translate-x-1/2 z-40",
          className
        )}
        role="status"
        aria-live="polite"
      >
        <div 
          className="w-64 h-20 rounded-2xl bg-gradient-to-br from-primary/40 to-secondary/40 relative overflow-hidden"
          style={{
            animation: 'pulse 1.5s ease-in-out infinite'
          }}
        >
          {/* Shimmer overlay effect */}
          <div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            style={{
              animation: 'shimmerSlide 2s ease-in-out infinite',
              transform: 'translateX(-100%)'
            }}
          />
        </div>
      </div>
    )
  }

  // Default skeleton with shimmer effect
  return (
    <div 
      className={cn(
        "bg-muted rounded-lg relative overflow-hidden",
        className
      )}
      role="status"
      aria-label="Loading content"
    >
      <div className="h-full w-full animate-pulse" />
      {/* Shimmer gradient overlay */}
      <div 
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
        style={{
          animation: 'shimmerSlide 2s ease-in-out infinite',
          transform: 'translateX(-100%)'
        }}
      />
    </div>
  )
})

LoadingSkeleton.displayName = 'LoadingSkeleton'
