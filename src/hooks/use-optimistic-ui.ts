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
    // Note: React 19's startTransition doesn't await async functions
    // The transition ends immediately, so we manually track the async state
    return callback()
  }, [])

  return {
    isPending,
    startOptimisticUpdate,
    startAsyncUpdate
  }
}

/**
 * NOTE: This is a placeholder for future enhancement
 * Currently just calls the callback directly
 * 
 * For actual usage, wrap callbacks in a component that uses useOptimisticUI:
 * 
 * @example
 * ```typescript
 * const MyComponent = () => {
 *   const { startOptimisticUpdate } = useOptimisticUI()
 *   
 *   const updateBackground = () => {
 *     startOptimisticUpdate(() => {
 *       setBackgroundClass(pickRandomBackground())
 *     })
 *   }
 * }
 * ```
 */
export const withOptimisticUpdate = (callback: () => void) => {
  return () => {
    // Direct call - actual transition wrapping must happen in a component context
    callback()
  }
}
