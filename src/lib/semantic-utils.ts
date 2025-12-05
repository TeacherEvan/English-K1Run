/**
 * Semantic Utility Functions - Production-grade helper utilities
 * 
 * This module provides clearly-named utility functions following 2025 TypeScript
 * best practices for semantic naming and type safety.
 * 
 * @module semantic-utils
 * 
 * Naming Conventions:
 * - Functions use descriptive verbs (calculate, generate, validate, transform)
 * - Parameters clearly indicate their purpose
 * - Return types are explicitly defined for type safety
 * - Complex operations are decomposed into smaller, single-purpose functions
 * 
 * @example
 * ```typescript
 * import { 
 *   calculatePercentageWithinBounds,
 *   generateUniqueIdentifier,
 *   validateNumericRange
 * } from './semantic-utils'
 * 
 * const progress = calculatePercentageWithinBounds(45, 0, 100) // 45
 * const id = generateUniqueIdentifier('player') // 'player-1670000000000-abc123'
 * const isValid = validateNumericRange(50, 0, 100) // true
 * ```
 */

/**
 * Calculate a clamped percentage value within specified bounds
 * 
 * Ensures the value never exceeds max or falls below min, useful for
 * progress bars, volume controls, and any bounded numeric display.
 * 
 * @param currentValue - The current numeric value to clamp
 * @param minimumBound - The minimum allowed value (inclusive)
 * @param maximumBound - The maximum allowed value (inclusive)
 * @returns The clamped value between min and max
 * 
 * @example
 * ```typescript
 * calculatePercentageWithinBounds(150, 0, 100) // Returns 100
 * calculatePercentageWithinBounds(-10, 0, 100) // Returns 0
 * calculatePercentageWithinBounds(50, 0, 100)  // Returns 50
 * ```
 */
export const calculatePercentageWithinBounds = (
  currentValue: number,
  minimumBound: number,
  maximumBound: number
): number => {
  return Math.min(maximumBound, Math.max(minimumBound, currentValue))
}

/**
 * Generate a unique identifier with optional prefix
 * 
 * Creates collision-resistant IDs using timestamp and random string.
 * Suitable for DOM element IDs, object keys, and temporary identifiers.
 * 
 * @param identifierPrefix - Optional prefix for the ID (default: 'id')
 * @returns A unique identifier string
 * 
 * @example
 * ```typescript
 * generateUniqueIdentifier('user')    // 'user-1670000000000-a1b2c3'
 * generateUniqueIdentifier('session') // 'session-1670000000000-d4e5f6'
 * generateUniqueIdentifier()          // 'id-1670000000000-g7h8i9'
 * ```
 */
export const generateUniqueIdentifier = (identifierPrefix = 'id'): string => {
  const currentTimestamp = Date.now()
  const randomSuffix = Math.random().toString(36).slice(2, 8)
  return `${identifierPrefix}-${currentTimestamp}-${randomSuffix}`
}

/**
 * Validate if a numeric value falls within a specified range
 * 
 * Useful for form validation, game mechanics, and data integrity checks.
 * 
 * @param valueToCheck - The numeric value to validate
 * @param minimumAllowed - The minimum acceptable value (inclusive)
 * @param maximumAllowed - The maximum acceptable value (inclusive)
 * @returns true if value is within range, false otherwise
 * 
 * @example
 * ```typescript
 * validateNumericRange(50, 0, 100)  // true
 * validateNumericRange(-1, 0, 100)  // false
 * validateNumericRange(101, 0, 100) // false
 * ```
 */
export const validateNumericRange = (
  valueToCheck: number,
  minimumAllowed: number,
  maximumAllowed: number
): boolean => {
  return valueToCheck >= minimumAllowed && valueToCheck <= maximumAllowed
}

/**
 * Transform an array into a randomly shuffled copy using Fisher-Yates algorithm
 * 
 * Creates a new array without mutating the original. Provides uniform random
 * distribution for fair gameplay and unpredictable ordering.
 * 
 * @template ElementType - The type of array elements
 * @param sourceArray - The array to shuffle
 * @returns A new shuffled array with the same elements
 * 
 * @example
 * ```typescript
 * const numbers = [1, 2, 3, 4, 5]
 * const shuffled = transformArrayToRandomOrder(numbers)
 * // shuffled might be [3, 1, 5, 2, 4]
 * // numbers remains [1, 2, 3, 4, 5]
 * ```
 */
export const transformArrayToRandomOrder = <ElementType>(
  sourceArray: ElementType[]
): ElementType[] => {
  const shuffledCopy = [...sourceArray]
  
  // Fisher-Yates shuffle algorithm for uniform distribution
  for (let currentIndex = shuffledCopy.length - 1; currentIndex > 0; currentIndex--) {
    const randomIndex = Math.floor(Math.random() * (currentIndex + 1))
    // Swap elements using array destructuring
    ;[shuffledCopy[currentIndex], shuffledCopy[randomIndex]] = 
      [shuffledCopy[randomIndex], shuffledCopy[currentIndex]]
  }
  
  return shuffledCopy
}

/**
 * Calculate the Euclidean distance between two points in 2D space
 * 
 * Essential for collision detection, proximity checks, and spatial calculations
 * in game mechanics.
 * 
 * @param firstPointX - X coordinate of the first point
 * @param firstPointY - Y coordinate of the first point
 * @param secondPointX - X coordinate of the second point
 * @param secondPointY - Y coordinate of the second point
 * @returns The distance between the two points
 * 
 * @example
 * ```typescript
 * const distance = calculateDistanceBetweenPoints(0, 0, 3, 4)
 * // Returns 5 (the hypotenuse of a 3-4-5 right triangle)
 * ```
 */
export const calculateDistanceBetweenPoints = (
  firstPointX: number,
  firstPointY: number,
  secondPointX: number,
  secondPointY: number
): number => {
  const deltaX = secondPointX - firstPointX
  const deltaY = secondPointY - firstPointY
  return Math.sqrt(deltaX * deltaX + deltaY * deltaY)
}

/**
 * Determine if two circular objects are colliding based on their positions and radii
 * 
 * Used for efficient collision detection in games with circular hit boxes.
 * More performant than pixel-perfect collision for circular objects.
 * 
 * @param firstObjectX - X coordinate of first object's center
 * @param firstObjectY - Y coordinate of first object's center
 * @param firstObjectRadius - Radius of first object
 * @param secondObjectX - X coordinate of second object's center
 * @param secondObjectY - Y coordinate of second object's center
 * @param secondObjectRadius - Radius of second object
 * @returns true if objects are colliding, false otherwise
 * 
 * @example
 * ```typescript
 * const isColliding = determineCircularCollision(10, 10, 5, 20, 20, 5)
 * // Checks if two circles with radius 5 at (10,10) and (20,20) overlap
 * ```
 */
export const determineCircularCollision = (
  firstObjectX: number,
  firstObjectY: number,
  firstObjectRadius: number,
  secondObjectX: number,
  secondObjectY: number,
  secondObjectRadius: number
): boolean => {
  const distance = calculateDistanceBetweenPoints(
    firstObjectX,
    firstObjectY,
    secondObjectX,
    secondObjectY
  )
  const combinedRadii = firstObjectRadius + secondObjectRadius
  return distance < combinedRadii
}

/**
 * Format milliseconds into a human-readable time string (MM:SS)
 * 
 * Useful for displaying countdown timers, elapsed time, and duration values
 * in a user-friendly format.
 * 
 * @param totalMilliseconds - Time duration in milliseconds
 * @returns Formatted time string in MM:SS format
 * 
 * @example
 * ```typescript
 * formatMillisecondsAsMinutesSeconds(65000)  // '01:05'
 * formatMillisecondsAsMinutesSeconds(125000) // '02:05'
 * formatMillisecondsAsMinutesSeconds(5000)   // '00:05'
 * ```
 */
export const formatMillisecondsAsMinutesSeconds = (totalMilliseconds: number): string => {
  const totalSeconds = Math.floor(totalMilliseconds / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const remainingSeconds = totalSeconds % 60
  
  const minutesFormatted = minutes.toString().padStart(2, '0')
  const secondsFormatted = remainingSeconds.toString().padStart(2, '0')
  
  return `${minutesFormatted}:${secondsFormatted}`
}

/**
 * Calculate percentage completion from current and target values
 * 
 * Returns a value between 0-100 representing progress toward a goal.
 * Useful for progress bars, achievement tracking, and completion indicators.
 * 
 * @param currentProgress - Current progress value
 * @param targetGoal - Target goal value
 * @param decimalPlaces - Number of decimal places to round to (default: 0)
 * @returns Percentage completion (0-100)
 * 
 * @example
 * ```typescript
 * calculatePercentageCompletion(25, 100)    // 25
 * calculatePercentageCompletion(33, 100, 1) // 33.0
 * calculatePercentageCompletion(1, 3, 2)    // 33.33
 * ```
 */
export const calculatePercentageCompletion = (
  currentProgress: number,
  targetGoal: number,
  decimalPlaces = 0
): number => {
  if (targetGoal === 0) return 0
  
  const rawPercentage = (currentProgress / targetGoal) * 100
  const clampedPercentage = calculatePercentageWithinBounds(rawPercentage, 0, 100)
  
  return Number(clampedPercentage.toFixed(decimalPlaces))
}

/**
 * Generate a random number within a specified range (inclusive)
 * 
 * Provides uniform random distribution for game mechanics, animations,
 * and unpredictable behavior.
 * 
 * @param minimumValue - The minimum value (inclusive)
 * @param maximumValue - The maximum value (inclusive)
 * @returns A random number between min and max
 * 
 * @example
 * ```typescript
 * generateRandomNumberInRange(1, 10)   // Random number from 1 to 10
 * generateRandomNumberInRange(0, 100)  // Random number from 0 to 100
 * ```
 */
export const generateRandomNumberInRange = (
  minimumValue: number,
  maximumValue: number
): number => {
  return Math.random() * (maximumValue - minimumValue) + minimumValue
}

/**
 * Generate a random integer within a specified range (inclusive)
 * 
 * Similar to generateRandomNumberInRange but returns whole numbers only.
 * 
 * @param minimumValue - The minimum value (inclusive)
 * @param maximumValue - The maximum value (inclusive)
 * @returns A random integer between min and max
 * 
 * @example
 * ```typescript
 * generateRandomIntegerInRange(1, 6)  // Random dice roll (1-6)
 * generateRandomIntegerInRange(0, 10) // Random integer (0-10)
 * ```
 */
export const generateRandomIntegerInRange = (
  minimumValue: number,
  maximumValue: number
): number => {
  return Math.floor(generateRandomNumberInRange(minimumValue, maximumValue + 1))
}

/**
 * Debounce a function to limit its execution frequency
 * 
 * Prevents rapid repeated calls by ensuring the function only executes
 * after a specified delay has passed since the last call.
 * 
 * @template FunctionParameters - The function parameter types
 * @param functionToDebounce - The function to debounce
 * @param delayInMilliseconds - Delay in milliseconds before execution
 * @returns A debounced version of the function
 * 
 * @example
 * ```typescript
 * const debouncedSearch = createDebouncedFunction(
 *   (query: string) => performSearch(query),
 *   300
 * )
 * 
 * // Only executes after 300ms of no calls
 * debouncedSearch('apple')
 * debouncedSearch('apples') // Previous call cancelled
 * ```
 */
export const createDebouncedFunction = <FunctionParameters extends unknown[]>(
  functionToDebounce: (...args: FunctionParameters) => void,
  delayInMilliseconds: number
): ((...args: FunctionParameters) => void) => {
  let timeoutIdentifier: NodeJS.Timeout | null = null
  
  return (...executionArgs: FunctionParameters) => {
    if (timeoutIdentifier !== null) {
      clearTimeout(timeoutIdentifier)
    }
    
    timeoutIdentifier = setTimeout(() => {
      functionToDebounce(...executionArgs)
    }, delayInMilliseconds)
  }
}

/**
 * Throttle a function to limit its execution rate
 * 
 * Ensures the function executes at most once per specified interval,
 * useful for scroll handlers, resize events, and high-frequency updates.
 * 
 * @template FunctionParameters - The function parameter types
 * @param functionToThrottle - The function to throttle
 * @param intervalInMilliseconds - Minimum time between executions
 * @returns A throttled version of the function
 * 
 * @example
 * ```typescript
 * const throttledScroll = createThrottledFunction(
 *   () => updateScrollPosition(),
 *   100
 * )
 * 
 * window.addEventListener('scroll', throttledScroll)
 * // Only executes once per 100ms, even with rapid scrolling
 * ```
 */
export const createThrottledFunction = <FunctionParameters extends unknown[]>(
  functionToThrottle: (...args: FunctionParameters) => void,
  intervalInMilliseconds: number
): ((...args: FunctionParameters) => void) => {
  let isThrottled = false
  
  return (...executionArgs: FunctionParameters) => {
    if (isThrottled) return
    
    functionToThrottle(...executionArgs)
    isThrottled = true
    
    setTimeout(() => {
      isThrottled = false
    }, intervalInMilliseconds)
  }
}

/**
 * Deep clone an object or array using structured cloning
 * 
 * Creates a complete deep copy including nested objects and arrays.
 * More reliable than JSON.parse(JSON.stringify()) for complex data structures.
 * 
 * @template DataStructure - The type of data to clone
 * @param sourceData - The object or array to clone
 * @returns A deep clone of the source data
 * 
 * @example
 * ```typescript
 * const original = { user: { name: 'Alice', scores: [1, 2, 3] } }
 * const cloned = createDeepClone(original)
 * cloned.user.name = 'Bob'
 * // original.user.name remains 'Alice'
 * ```
 */
export const createDeepClone = <DataStructure>(sourceData: DataStructure): DataStructure => {
  // Use structured clone API for reliable deep cloning (available in modern browsers)
  if (typeof structuredClone !== 'undefined') {
    return structuredClone(sourceData)
  }
  
  // Fallback: JSON serialization (limitations with functions, dates, etc.)
  return JSON.parse(JSON.stringify(sourceData)) as DataStructure
}

/**
 * Check if the code is running in development mode
 * 
 * Useful for conditional logging, debugging features, and development-only code.
 * 
 * @returns true if in development mode, false otherwise
 * 
 * @example
 * ```typescript
 * if (isRunningInDevelopmentMode()) {
 *   console.log('Debug information:', debugData)
 * }
 * ```
 */
export const isRunningInDevelopmentMode = (): boolean => {
  return import.meta.env.DEV
}

/**
 * Check if the code is running in production mode
 * 
 * Inverse of isRunningInDevelopmentMode, useful for production-specific features.
 * 
 * @returns true if in production mode, false otherwise
 * 
 * @example
 * ```typescript
 * if (isRunningInProductionMode()) {
 *   enableAnalytics()
 * }
 * ```
 */
export const isRunningInProductionMode = (): boolean => {
  return import.meta.env.PROD
}
