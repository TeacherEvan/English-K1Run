/**
 * Performance Utilities
 * 
 * Collection of performance optimization utilities for React applications.
 * Includes debouncing, throttling, and memoization helpers.
 * 
 * @module performance-utils
 */

/**
 * Creates a debounced version of a function that delays execution until after
 * the specified wait time has elapsed since the last invocation.
 * 
 * Useful for:
 * - Search input handlers
 * - Window resize handlers
 * - Scroll event listeners
 * 
 * @template T - Function type to debounce
 * @param func - Function to debounce
 * @param waitMs - Milliseconds to wait before executing
 * @returns Debounced function with cancel method
 * 
 * @example
 * ```typescript
 * const debouncedSearch = debounce((query: string) => {
 *   console.log('Searching for:', query)
 * }, 300)
 * 
 * // Multiple rapid calls
 * debouncedSearch('a')    // Won't execute
 * debouncedSearch('ab')   // Won't execute
 * debouncedSearch('abc')  // Executes after 300ms
 * 
 * // Cancel pending execution
 * debouncedSearch.cancel()
 * ```
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  waitMs: number
): T & { cancel: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  const debounced = function(this: unknown, ...args: Parameters<T>) {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId)
    }
    timeoutId = setTimeout(() => {
      func.apply(this, args)
    }, waitMs)
  } as T & { cancel: () => void }

  debounced.cancel = () => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId)
      timeoutId = undefined
    }
  }

  return debounced
}

/**
 * Creates a throttled version of a function that executes at most once per
 * specified time interval.
 * 
 * Unlike debounce, throttle guarantees execution at regular intervals.
 * 
 * Useful for:
 * - Scroll position tracking
 * - Mouse move handlers
 * - Animation frames
 * 
 * @template T - Function type to throttle
 * @param func - Function to throttle
 * @param limitMs - Minimum milliseconds between executions
 * @returns Throttled function
 * 
 * @example
 * ```typescript
 * const throttledScroll = throttle((position: number) => {
 *   console.log('Scroll position:', position)
 * }, 100)
 * 
 * // Rapid calls (only executes every 100ms)
 * window.addEventListener('scroll', () => {
 *   throttledScroll(window.scrollY)
 * })
 * ```
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limitMs: number
): T {
  let inThrottle = false
  
  return function(this: unknown, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limitMs)
    }
  } as T
}

/**
 * Clamps a numeric value between minimum and maximum bounds.
 * 
 * @param value - Value to clamp
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @returns Clamped value
 * 
 * @example
 * ```typescript
 * clamp(50, 0, 100)   // => 50
 * clamp(-10, 0, 100)  // => 0
 * clamp(150, 0, 100)  // => 100
 * ```
 */
export function clampValue(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Checks if a value is defined (not null or undefined).
 * Type guard for non-nullable values.
 * 
 * @template T - Type to check
 * @param value - Value to validate
 * @returns True if value is defined
 * 
 * @example
 * ```typescript
 * const maybeValue: string | null = getValue()
 * if (isDefined(maybeValue)) {
 *   // TypeScript knows maybeValue is string here
 *   console.log(maybeValue.toUpperCase())
 * }
 * ```
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}

/**
 * Safely parses a JSON string, returning a fallback value on error.
 * 
 * @template T - Expected return type
 * @param jsonString - JSON string to parse
 * @param fallback - Value to return if parsing fails
 * @returns Parsed object or fallback
 * 
 * @example
 * ```typescript
 * const data = safeJsonParse<User>('{"name":"John"}', { name: 'Unknown' })
 * const invalid = safeJsonParse<User>('invalid json', { name: 'Unknown' })
 * ```
 */
export function safeJsonParse<T>(jsonString: string, fallback: T): T {
  try {
    return JSON.parse(jsonString) as T
  } catch {
    return fallback
  }
}

/**
 * Formats a number to a localized string with optional decimal places.
 * 
 * @param value - Number to format
 * @param decimals - Number of decimal places (default: 0)
 * @param locale - Locale for formatting (default: 'en-US')
 * @returns Formatted number string
 * 
 * @example
 * ```typescript
 * formatNumber(1234.567)           // => '1,235'
 * formatNumber(1234.567, 2)        // => '1,234.57'
 * formatNumber(1234.567, 2, 'de')  // => '1.234,57'
 * ```
 */
export function formatNumber(
  value: number,
  decimals: number = 0,
  locale: string = 'en-US'
): string {
  return value.toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}

/**
 * Generates a random integer between min (inclusive) and max (inclusive).
 * 
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Random integer
 * 
 * @example
 * ```typescript
 * randomInt(1, 6)  // Dice roll: 1-6
 * randomInt(0, 100) // Random percentage
 * ```
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Creates a promise that resolves after the specified delay.
 * Useful for async/await patterns and testing.
 * 
 * @param ms - Milliseconds to wait
 * @returns Promise that resolves after delay
 * 
 * @example
 * ```typescript
 * async function animateSequence() {
 *   showElement()
 *   await delay(1000)
 *   hideElement()
 * }
 * ```
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Retries an async operation with exponential backoff.
 * 
 * @template T - Return type of async function
 * @param fn - Async function to retry
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @param baseDelayMs - Base delay in ms, doubles each retry (default: 1000)
 * @returns Promise with result or throws last error
 * 
 * @example
 * ```typescript
 * const data = await retryWithBackoff(
 *   () => fetch('/api/data').then(r => r.json()),
 *   3,    // Max 3 retries
 *   1000  // Start with 1s delay
 * )
 * ```
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 1000
): Promise<T> {
  let lastError: Error | undefined
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      
      if (attempt < maxRetries) {
        const delayMs = baseDelayMs * Math.pow(2, attempt)
        await delay(delayMs)
      }
    }
  }
  
  throw lastError || new Error('Operation failed after retries')
}
