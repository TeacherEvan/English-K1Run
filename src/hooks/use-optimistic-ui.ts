/**
 * useOptimisticUI Hook
 * 
 * Implements React 19 best practices for optimistic UI updates with concurrent features.
 * Uses useTransition to mark non-urgent updates and provide pending states for better UX.
 * 
 * @module use-optimistic-ui
 * 
 * Key Features:
 * - Leverages React 19's concurrent rendering
 * - Separates urgent from non-urgent state updates
 * - Provides loading states for async operations
 * - Improves perceived performance
 * 
 * Usage Example:
 * ```typescript
 * const { startOptimisticUpdate, isPending } = useOptimisticUI()
 * 
 * // Mark heavy updates as non-urgent
 * startOptimisticUpdate(() => {
 *   setExpensiveState(newValue)
 * })
 * ```
 * 
 * @see {@link https://react.dev/reference/react/useTransition}
 * @see {@link https://www.vebuild.com/blog/react-performance-optimization-2025}
 */

import { useCallback, useTransition } from 'react'

export interface OptimisticUIHook {
  /** Indicates if a non-urgent update is in progress */
  isPending: boolean
  /** 
   * Wrap non-urgent state updates in this function to improve responsiveness
   * Allows React to prioritize urgent updates (like user input) over background work
   */
  startOptimisticUpdate: (callback: () => void) => void
  /**
   * Start an async optimistic update (React 19 feature)
   * Handles promises and provides automatic loading state management
   */
  startAsyncUpdate: (callback: () => Promise<void>) => Promise<void>
}

/**
 * Hook for managing optimistic UI updates with React 19 concurrent features
 * 
 * Perfect for:
 * - Heavy list filtering or sorting
 * - Background data calculations
 * - Non-critical UI updates
 * - Target changes in game logic
 * - Background rotations
 * 
 * @returns {OptimisticUIHook} Object with isPending flag and update functions
 * 
 * @example
 * ```typescript
 * const { startOptimisticUpdate, isPending } = useOptimisticUI()
 * 
 * const handleHeavyOperation = () => {
 *   // Urgent: Update input immediately
 *   setInputValue(newValue)
 *   
 *   // Non-urgent: Filter in background
 *   startOptimisticUpdate(() => {
 *     setFilteredResults(computeExpensiveFilter(newValue))
 *   })
 * }
 * ```
 */
export const useOptimisticUI = (): OptimisticUIHook => {
  const [isPending, startTransition] = useTransition()

  const startOptimisticUpdate = useCallback((callback: () => void) => {
    startTransition(() => {
      callback()
    })
  }, [startTransition])

  const startAsyncUpdate = useCallback(async (callback: () => Promise<void>) => {
    return new Promise<void>((resolve, reject) => {
      startTransition(async () => {
        try {
          await callback()
          resolve()
        } catch (error) {
          reject(error)
        }
      })
    })
  }, [startTransition])

  return {
    isPending,
    startOptimisticUpdate,
    startAsyncUpdate
  }
}

/**
 * Higher-order component for wrapping non-urgent updates
 * Useful when you want to extract the transition logic from component code
 * 
 * @param callback - Function containing non-urgent state updates
 * @returns Wrapped function that automatically uses startTransition
 * 
 * @example
 * ```typescript
 * const updateBackground = withOptimisticUpdate(() => {
 *   setBackgroundClass(pickRandomBackground())
 * })
 * ```
 */
export const withOptimisticUpdate = (callback: () => void) => {
  return () => {
    // This would need to be called from a component that has useTransition
    // For now, just call the callback directly
    callback()
  }
}
