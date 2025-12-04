import { memo } from 'react'
import { cn } from '../lib/utils'

interface LoadingSkeletonProps {
  /** Variant of the loading skeleton */
  variant?: 'default' | 'worm' | 'fireworks' | 'achievement'
  /** Additional CSS classes */
  className?: string
}

/**
 * LoadingSkeleton - Beautiful loading state component
 * 
 * Provides engaging loading states for async components with
 * smooth animations and modern aesthetics.
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
      <div className={cn(
        "h-screen w-screen flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20",
        className
      )}>
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🐛</div>
          <div className="text-xl font-semibold text-primary animate-pulse">
            Loading game...
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'fireworks') {
    return (
      <div className={cn(
        "absolute inset-0 flex items-center justify-center pointer-events-none",
        className
      )}>
        <div className="text-8xl animate-pulse">🎆</div>
      </div>
    )
  }

  if (variant === 'achievement') {
    return (
      <div className={cn(
        "absolute top-28 left-1/2 -translate-x-1/2 z-40",
        className
      )}>
        <div className="w-64 h-20 rounded-2xl bg-gradient-to-br from-primary/40 to-secondary/40 animate-pulse" />
      </div>
    )
  }

  // Default skeleton
  return (
    <div className={cn(
      "animate-pulse bg-muted rounded-lg",
      className
    )}>
      <div className="h-full w-full" />
    </div>
  )
})

LoadingSkeleton.displayName = 'LoadingSkeleton'
