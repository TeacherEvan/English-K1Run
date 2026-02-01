/// <reference types="vite/client" />
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
 *   clamp,
 *   generateUniqueId,
 *   isInRange,
 *   shuffle
 * } from './semantic-utils'
 *
 * const progress = clamp(45, 0, 100) // 45
 * const id = generateUniqueId({ prefix: 'player' }) // 'player-abc123-xyz789'
 * const isValid = isInRange(50, 0, 100) // true
 * ```
 */

import type {
  DebouncedFunction,
  ThrottledFunction,
  ThrottleOptions,
  Point2D,
  Circle,
  UniqueIdOptions,
} from "./types";

// =============================================================================
// TYPE GUARDS AND VALIDATION HELPERS
// =============================================================================

/**
 * Check if a value is a valid finite number (not NaN, Infinity, or -Infinity)
 *
 * @param value - The value to check
 * @returns true if the value is a valid finite number
 */
const isValidNumber = (value: unknown): value is number => {
  return typeof value === "number" && Number.isFinite(value);
};

/**
 * Validate that all provided values are valid numbers
 * Throws a TypeError with descriptive message if validation fails
 *
 * @param values - Record of parameter names to their values
 * @throws {TypeError} If any value is not a valid finite number
 */
const validateNumericInputs = (values: Record<string, unknown>): void => {
  for (const [name, value] of Object.entries(values)) {
    if (!isValidNumber(value)) {
      throw new TypeError(
        `Expected "${name}" to be a valid finite number, received ${value === null ? "null" : typeof value}`,
      );
    }
  }
};

/**
 * Validate that min <= max for range operations
 *
 * @param min - The minimum bound
 * @param max - The maximum bound
 * @param minName - Name of the minimum parameter for error messages
 * @param maxName - Name of the maximum parameter for error messages
 * @throws {RangeError} If min > max
 */
const validateRangeOrder = (
  min: number,
  max: number,
  minName = "minimum",
  maxName = "maximum",
): void => {
  if (min > max) {
    throw new RangeError(
      `${minName} (${min}) must be less than or equal to ${maxName} (${max})`,
    );
  }
};

// =============================================================================
// BOUNDING AND CLAMPING
// =============================================================================

/**
 * Clamp a value within specified bounds (inclusive)
 *
 * Ensures the value never exceeds max or falls below min. Useful for
 * progress bars, volume controls, and any bounded numeric display.
 *
 * @param value - The numeric value to clamp
 * @param min - The minimum allowed value (inclusive)
 * @param max - The maximum allowed value (inclusive)
 * @returns The clamped value between min and max
 * @throws {TypeError} If any argument is not a valid finite number
 * @throws {RangeError} If min > max
 *
 * @example
 * ```typescript
 * clamp(150, 0, 100)  // 100
 * clamp(-10, 0, 100)  // 0
 * clamp(50, 0, 100)   // 50
 * clamp(50, 100, 0)   // throws RangeError
 * ```
 */
export const clamp = (value: number, min: number, max: number): number => {
  validateNumericInputs({ value, min, max });
  validateRangeOrder(min, max);

  return Math.min(max, Math.max(min, value));
};

/**
 * Calculate percentage completion from current and target values
 *
 * Returns a value between 0-100 representing progress toward a goal.
 * Useful for progress bars, achievement tracking, and completion indicators.
 *
 * @param current - Current progress value
 * @param target - Target goal value
 * @param options - Optional configuration
 * @param options.decimalPlaces - Number of decimal places (0-20, default: 0)
 * @param options.clampResult - Whether to clamp result to 0-100 (default: true)
 * @returns Percentage completion (0-100 by default)
 * @throws {TypeError} If numeric arguments are invalid
 * @throws {RangeError} If decimalPlaces is not 0-20
 *
 * @example
 * ```typescript
 * calculatePercentage(25, 100)              // 25
 * calculatePercentage(33, 100, { decimalPlaces: 1 }) // 33.0
 * calculatePercentage(1, 3, { decimalPlaces: 2 })    // 33.33
 * calculatePercentage(150, 100)             // 100 (clamped)
 * calculatePercentage(150, 100, { clampResult: false }) // 150
 * ```
 */
export const calculatePercentage = (
  current: number,
  target: number,
  options: { decimalPlaces?: number; clampResult?: boolean } = {},
): number => {
  const { decimalPlaces = 0, clampResult = true } = options;

  validateNumericInputs({ current, target, decimalPlaces });

  if (
    !Number.isInteger(decimalPlaces) ||
    decimalPlaces < 0 ||
    decimalPlaces > 20
  ) {
    throw new RangeError("decimalPlaces must be an integer between 0 and 20");
  }

  if (target === 0) {
    return 0;
  }

  const percentage = (current / target) * 100;
  const finalValue = clampResult ? clamp(percentage, 0, 100) : percentage;

  return Number(finalValue.toFixed(decimalPlaces));
};

// =============================================================================
// RANDOM GENERATION
// =============================================================================

/**
 * Generate a random floating-point number within a range [min, max)
 *
 * The upper bound is exclusive. For integer ranges, use randomInt.
 * Uses Math.random() which is NOT cryptographically secure.
 *
 * @param min - The minimum value (inclusive)
 * @param max - The maximum value (exclusive)
 * @returns A random number in [min, max)
 * @throws {TypeError} If arguments are not valid finite numbers
 * @throws {RangeError} If min >= max
 *
 * @example
 * ```typescript
 * randomFloat(0, 1)    // Random number [0, 1)
 * randomFloat(10, 20)  // Random number [10, 20)
 * ```
 */
export const randomFloat = (min: number, max: number): number => {
  validateNumericInputs({ min, max });

  if (min >= max) {
    throw new RangeError(`min (${min}) must be less than max (${max})`);
  }

  return Math.random() * (max - min) + min;
};

/**
 * Generate a random integer within a range [min, max] (both inclusive)
 *
 * Provides uniform distribution for game mechanics, dice rolls, etc.
 * Uses Math.random() which is NOT cryptographically secure.
 *
 * @param min - The minimum value (inclusive)
 * @param max - The maximum value (inclusive)
 * @returns A random integer in [min, max]
 * @throws {TypeError} If arguments are not valid finite numbers
 * @throws {RangeError} If min > max or range exceeds Number.MAX_SAFE_INTEGER
 *
 * @example
 * ```typescript
 * randomInt(1, 6)   // Dice roll: 1, 2, 3, 4, 5, or 6
 * randomInt(0, 10)  // Random integer 0-10
 * ```
 */
export const randomInt = (min: number, max: number): number => {
  validateNumericInputs({ min, max });
  validateRangeOrder(min, max);

  const range = max - min;

  // Guard against integer overflow
  if (range > Number.MAX_SAFE_INTEGER) {
    throw new RangeError(
      `Range size (${range}) exceeds MAX_SAFE_INTEGER (${Number.MAX_SAFE_INTEGER})`,
    );
  }

  return Math.floor(Math.random() * (range + 1)) + min;
};

/**
 * Generate a cryptographically secure random integer (where available)
 * Falls back to Math.random() in environments without crypto API
 *
 * @param min - The minimum value (inclusive)
 * @param max - The maximum value (inclusive)
 * @returns A securely random integer in [min, max]
 * @throws {TypeError} If arguments are not valid finite numbers
 * @throws {RangeError} If min > max
 *
 * @example
 * ```typescript
 * secureRandomInt(0, 100)  // Cryptographically secure random
 * ```
 */
export const secureRandomInt = (min: number, max: number): number => {
  validateNumericInputs({ min, max });
  validateRangeOrder(min, max);

  const range = max - min + 1;

  // Use crypto API if available
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.getRandomValues === "function"
  ) {
    // For small ranges, use simple rejection sampling
    if (range <= 256) {
      const arr = new Uint8Array(1);
      let result: number;
      do {
        crypto.getRandomValues(arr);
        result = arr[0];
      } while (result >= Math.floor(256 / range) * range);
      return (result % range) + min;
    }

    // For larger ranges, use 32-bit values
    if (range <= 0x100000000) {
      const arr = new Uint32Array(1);
      let result: number;
      do {
        crypto.getRandomValues(arr);
        result = arr[0];
      } while (result >= Math.floor(0x100000000 / range) * range);
      return (result % range) + min;
    }
  }

  // Fallback to Math.random()
  return randomInt(min, max);
};

/**
 * Generate a unique identifier with configurable options
 *
 * Uses crypto.randomUUID() when available for guaranteed uniqueness,
 * falls back to timestamp + random + counter for collision resistance.
 *
 * @param options - Configuration options
 * @param options.prefix - Optional prefix for the ID (default: none)
 * @param options.suffix - Optional suffix for the ID (default: none)
 * @param options.length - Length of random component (default: 12)
 * @param options.separator - Separator between components (default: '-')
 * @returns A unique identifier string
 *
 * @example
 * ```typescript
 * generateUniqueId()                           // 'abc123def456'
 * generateUniqueId({ prefix: 'user' })         // 'user-abc123def456'
 * generateUniqueId({ prefix: 'session', length: 8 }) // 'session-abc123de'
 * ```
 */
export const generateUniqueId = (options: UniqueIdOptions = {}): string => {
  const { prefix, suffix, length = 12, separator = "-" } = options;

  if (!Number.isInteger(length) || length < 4 || length > 64) {
    throw new RangeError("length must be an integer between 4 and 64");
  }

  let id: string;

  // Use crypto.randomUUID() if available (most secure)
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    id = crypto.randomUUID().replace(/-/g, "").slice(0, length);
  } else {
    // Fallback: timestamp + counter + random for collision resistance
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random()
      .toString(36)
      .slice(2, 2 + length / 2);
    id = `${timestamp}${randomPart}`.slice(0, length);
  }

  const parts = [prefix, id, suffix].filter(Boolean);
  return parts.join(separator);
};

// =============================================================================
// ARRAY OPERATIONS
// =============================================================================

/**
 * Create a shuffled copy of an array using Fisher-Yates algorithm
 *
 * Creates a new array without mutating the original. Provides uniform random
 * distribution for fair gameplay and unpredictable ordering.
 *
 * Uses Math.random() - NOT cryptographically secure. For security-sensitive
 * shuffling, implement with crypto.getRandomValues().
 *
 * @template T - The type of array elements
 * @param array - The array to shuffle
 * @returns A new shuffled array with the same elements
 * @throws {TypeError} If input is not an array
 *
 * @example
 * ```typescript
 * const numbers = [1, 2, 3, 4, 5]
 * const shuffled = shuffle(numbers)
 * // shuffled might be [3, 1, 5, 2, 4]
 * // numbers remains [1, 2, 3, 4, 5]
 * ```
 */
export const shuffle = <T>(array: readonly T[]): T[] => {
  if (!Array.isArray(array)) {
    throw new TypeError(
      `Expected array, received ${array === null ? "null" : typeof array}`,
    );
  }

  if (array.length <= 1) {
    return [...array];
  }

  const result = [...array];

  // Fisher-Yates shuffle for uniform distribution
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
};

/**
 * Securely shuffle an array using cryptographically secure randomness
 * Falls back to regular shuffle() in environments without crypto API
 *
 * @template T - The type of array elements
 * @param array - The array to shuffle
 * @returns A new cryptographically shuffled array
 */
export const secureShuffle = <T>(array: readonly T[]): T[] => {
  if (!Array.isArray(array)) {
    throw new TypeError(
      `Expected array, received ${array === null ? "null" : typeof array}`,
    );
  }

  if (array.length <= 1) {
    return [...array];
  }

  const result = [...array];

  // Use crypto API if available
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.getRandomValues === "function"
  ) {
    for (let i = result.length - 1; i > 0; i--) {
      const j = secureRandomInt(0, i);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  // Fallback to regular shuffle
  return shuffle(array);
};

// =============================================================================
// SPATIAL AND GEOMETRY
// =============================================================================

/**
 * Calculate the Euclidean distance between two points in 2D space
 *
 * Uses a numerically stable algorithm to avoid overflow with large coordinates.
 * Essential for collision detection, proximity checks, and spatial calculations.
 *
 * @param p1 - First point with x and y coordinates
 * @param p2 - Second point with x and y coordinates
 * @returns The distance between the two points
 * @throws {TypeError} If coordinates are not valid finite numbers
 *
 * @example
 * ```typescript
 * const distance = distanceBetween({ x: 0, y: 0 }, { x: 3, y: 4 })
 * // Returns 5 (3-4-5 right triangle)
 * ```
 */
export const distanceBetween = (p1: Point2D, p2: Point2D): number => {
  validateNumericInputs({
    "p1.x": p1.x,
    "p1.y": p1.y,
    "p2.x": p2.x,
    "p2.y": p2.y,
  });

  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;

  // Use hypot for better numerical stability than sqrt(dx*dx + dy*dy)
  return Math.hypot(dx, dy);
};

/**
 * Optimized collision detection between two circles
 *
 * Uses squared distance comparison to avoid expensive sqrt operation.
 * More performant than distance-based checks for collision detection.
 *
 * @param c1 - First circle with center coordinates and radius
 * @param c2 - Second circle with center coordinates and radius
 * @returns true if circles are colliding/overlapping
 * @throws {TypeError} If numeric properties are invalid
 * @throws {RangeError} If any radius is negative
 *
 * @example
 * ```typescript
 * const isColliding = circlesCollide(
 *   { x: 10, y: 10, radius: 5 },
 *   { x: 20, y: 20, radius: 5 }
 * )
 * ```
 */
export const circlesCollide = (c1: Circle, c2: Circle): boolean => {
  validateNumericInputs({
    "c1.x": c1.x,
    "c1.y": c1.y,
    "c1.radius": c1.radius,
    "c2.x": c2.x,
    "c2.y": c2.y,
    "c2.radius": c2.radius,
  });

  if (c1.radius < 0 || c2.radius < 0) {
    throw new RangeError("Circle radius cannot be negative");
  }

  const dx = c2.x - c1.x;
  const dy = c2.y - c1.y;
  const distanceSquared = dx * dx + dy * dy;
  const radiusSum = c1.radius + c2.radius;

  // Compare squared values to avoid sqrt
  return distanceSquared < radiusSum * radiusSum;
};

// =============================================================================
// FORMATTING
// =============================================================================

/**
 * Format milliseconds into a human-readable time string
 *
 * Supports MM:SS format by default, with optional hours display.
 * Handles negative values by displaying absolute time with a prefix.
 *
 * @param ms - Time duration in milliseconds
 * @param options - Formatting options
 * @param options.showHours - Include hours in output (default: false)
 * @param options.showNegative - Show negative sign for negative values (default: true)
 * @returns Formatted time string
 * @throws {TypeError} If ms is not a valid finite number
 *
 * @example
 * ```typescript
 * formatDuration(65000)                    // '01:05'
 * formatDuration(125000)                   // '02:05'
 * formatDuration(5000)                     // '00:05'
 * formatDuration(3661000, { showHours: true }) // '01:01:01'
 * formatDuration(-65000)                   // '-01:05'
 * ```
 */
export const formatDuration = (
  ms: number,
  options: { showHours?: boolean; showNegative?: boolean } = {},
): string => {
  const { showHours = false, showNegative = true } = options;

  validateNumericInputs({ ms });

  const isNegative = ms < 0;
  const absMs = Math.abs(ms);
  const totalSeconds = Math.floor(absMs / 1000);
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const hours = Math.floor(totalMinutes / 60);

  const pad = (n: number) => n.toString().padStart(2, "0");

  const timeParts = showHours
    ? [pad(hours), pad(minutes), pad(seconds)]
    : [pad(minutes), pad(seconds)];

  const prefix = isNegative && showNegative ? "-" : "";
  return prefix + timeParts.join(":");
};

// =============================================================================
// FUNCTION DECORATORS
// =============================================================================

/**
 * Create a debounced function with cancellation and flush support
 *
 * Delays execution until after wait milliseconds have elapsed since the last call.
 * Useful for search inputs, resize handlers, and preventing rapid-fire API calls.
 *
 * @template Args - Argument tuple type
 * @template R - Return type
 * @param fn - The function to debounce
 * @param wait - Delay in milliseconds
 * @returns Debounced function with cancel() and flush() methods
 * @throws {TypeError} If fn is not a function or wait is invalid
 * @throws {RangeError} If wait is negative
 *
 * @example
 * ```typescript
 * const search = debounce((query: string) => {
 *   api.search(query)
 * }, 300)
 *
 * search('a')   // Will execute in 300ms
 * search('ab')  // Resets timer, will execute in 300ms
 * search.cancel() // Cancel pending execution
 * search.flush()  // Execute immediately and cancel pending
 * ```
 */
export const debounce = <Args extends unknown[], R>(
  fn: (...args: Args) => R,
  wait: number,
): DebouncedFunction<(...args: Args) => R> => {
  if (typeof fn !== "function") {
    throw new TypeError("Expected a function to debounce");
  }

  if (!isValidNumber(wait) || wait < 0) {
    throw new RangeError("wait must be a non-negative number");
  }

  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Args | null = null;
  let lastResult: R | undefined;

  const debounced = (...args: Args): R | undefined => {
    lastArgs = args;

    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      timeoutId = null;
      lastResult = fn(...lastArgs!);
    }, wait);

    return lastResult;
  };

  debounced.cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastArgs = null;
  };

  debounced.flush = (): R | undefined => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
      lastResult = fn(...lastArgs!);
    }
    return lastResult;
  };

  debounced.pending = () => timeoutId !== null;

  return debounced;
};

/**
 * Create a throttled function with leading/trailing edge control
 *
 * Ensures the function executes at most once per specified interval.
 * Supports both leading (immediate) and trailing (delayed) execution.
 *
 * @template Args - Argument tuple type
 * @template R - Return type
 * @param fn - The function to throttle
 * @param wait - Minimum time between executions in milliseconds
 * @param options - Throttling options
 * @param options.leading - Execute on the leading edge (default: true)
 * @param options.trailing - Execute on the trailing edge (default: true)
 * @returns Throttled function with cancel() method
 * @throws {TypeError} If fn is not a function
 * @throws {RangeError} If wait is negative
 *
 * @example
 * ```typescript
 * // Execute immediately, then wait
 * const scrollHandler = throttle(updatePosition, 100)
 *
 * // Only execute after wait, with final call
 * const saveHandler = throttle(saveData, 500, { leading: false })
 *
 * // Execute immediately and after wait
 * const syncHandler = throttle(syncData, 1000, { leading: true, trailing: true })
 * ```
 */
export const throttle = <Args extends unknown[], R>(
  fn: (...args: Args) => R,
  wait: number,
  options: ThrottleOptions = {},
): ThrottledFunction<(...args: Args) => R> => {
  if (typeof fn !== "function") {
    throw new TypeError("Expected a function to throttle");
  }

  if (!isValidNumber(wait) || wait < 0) {
    throw new RangeError("wait must be a non-negative number");
  }

  const { leading = true, trailing = true } = options;

  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Args | null = null;
  let lastCallTime = 0;
  let lastResult: R | undefined;

  const invoke = (args: Args): R | undefined => {
    lastCallTime = Date.now();
    lastArgs = null;
    lastResult = fn(...args);
    return lastResult;
  };

  const throttled = (...args: Args): R | undefined => {
    const now = Date.now();
    const remaining = wait - (now - lastCallTime);

    lastArgs = args;

    if (remaining <= 0 || remaining > wait) {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      if (leading) {
        return invoke(args);
      }

      lastCallTime = now;
      if (trailing && !timeoutId) {
        timeoutId = setTimeout(() => {
          timeoutId = null;
          if (lastArgs) {
            invoke(lastArgs);
          }
        }, wait);
      }
    } else if (!timeoutId && trailing) {
      timeoutId = setTimeout(() => {
        timeoutId = null;
        lastCallTime = leading ? Date.now() : 0;
        if (lastArgs) {
          invoke(lastArgs);
        }
      }, remaining);
    }

    return lastResult;
  };

  throttled.cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastArgs = null;
    lastCallTime = 0;
  };

  throttled.flush = (): R | undefined => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    if (lastArgs) {
      return invoke(lastArgs);
    }
    return lastResult;
  };

  return throttled;
};

// =============================================================================
// DEEP CLONING
// =============================================================================

/**
 * Deep clone a value with circular reference support
 *
 * Creates a complete deep copy including nested objects and arrays.
 * Handles circular references without infinite recursion.
 * Uses structuredClone() when available for best performance.
 *
 * @template T - The type of data to clone
 * @param value - The value to clone
 * @returns A deep clone of the value
 * @throws {TypeError} If value contains unsupported types (functions, symbols as keys)
 *
 * @example
 * ```typescript
 * const original = {
 *   user: { name: 'Alice', scores: [1, 2, 3] },
 *   createdAt: new Date()
 * }
 * const cloned = deepClone(original)
 * cloned.user.name = 'Bob'
 * // original.user.name remains 'Alice'
 * ```
 */
export const deepClone = <T>(value: T): T => {
  // Use structuredClone when available (best performance and feature support)
  if (typeof structuredClone === "function") {
    try {
      return structuredClone(value);
    } catch {
      // structuredClone throws on functions, DOM nodes, etc.
      // Fall through to manual implementation
    }
  }

  // Manual deep clone with circular reference detection
  const visited = new WeakMap<object, unknown>();

  const clone = <U>(val: U): U => {
    // Handle primitives and null
    if (val === null || typeof val !== "object") {
      return val;
    }

    // Check for circular references
    if (visited.has(val as object)) {
      return visited.get(val as object) as U;
    }

    // Handle Date
    if (val instanceof Date) {
      return new Date(val.getTime()) as U;
    }

    // Handle RegExp
    if (val instanceof RegExp) {
      return new RegExp(val.source, val.flags) as U;
    }

    // Handle Map
    if (val instanceof Map) {
      const clonedMap = new Map();
      visited.set(val as object, clonedMap);
      val.forEach((v, k) => {
        clonedMap.set(clone(k), clone(v));
      });
      return clonedMap as U;
    }

    // Handle Set
    if (val instanceof Set) {
      const clonedSet = new Set();
      visited.set(val as object, clonedSet);
      val.forEach((v) => {
        clonedSet.add(clone(v));
      });
      return clonedSet as U;
    }

    // Handle Array
    if (Array.isArray(val)) {
      const clonedArray: unknown[] = [];
      visited.set(val as object, clonedArray);
      for (let i = 0; i < val.length; i++) {
        clonedArray[i] = clone(val[i]);
      }
      return clonedArray as U;
    }

    // Handle plain objects
    const clonedObj: Record<string, unknown> = {};
    visited.set(val as object, clonedObj);

    for (const key of Object.keys(val as object)) {
      const descriptor = Object.getOwnPropertyDescriptor(val as object, key);
      if (descriptor) {
        Object.defineProperty(clonedObj, key, {
          ...descriptor,
          value: clone((val as Record<string, unknown>)[key]),
        });
      }
    }

    // Copy symbol properties
    const symbols = Object.getOwnPropertySymbols(val as object);
    for (const sym of symbols) {
      const descriptor = Object.getOwnPropertyDescriptor(val as object, sym);
      if (descriptor && descriptor.enumerable) {
        (clonedObj as Record<symbol, unknown>)[sym] = clone(
          (val as Record<symbol, unknown>)[sym],
        );
      }
    }

    return clonedObj as U;
  };

  return clone(value);
};

// =============================================================================
// ENVIRONMENT DETECTION
// =============================================================================

const getImportMetaEnv = ():
  | {
      DEV?: boolean;
      PROD?: boolean;
      MODE?: string;
      NODE_ENV?: string;
    }
  | undefined => {
  // Use any cast to avoid TS errors with ImportMeta definition conflicts
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (import.meta as any).env;
};

/**
 * Check if the code is running in development mode
 * Memoized for performance since this value never changes at runtime.
 *
 * @returns true if in development mode, false otherwise
 *
 * @example
 * ```typescript
 * if (isDevelopment()) {
 *   console.log('Debug information:', debugData)
 * }
 * ```
 */
export const isDevelopment = (() => {
  let cached: boolean | undefined;

  return (): boolean => {
    if (cached === undefined) {
      cached = getImportMetaEnv()?.DEV === true;
    }
    return cached;
  };
})();

/**
 * Check if the code is running in production mode
 * Memoized for performance since this value never changes at runtime.
 *
 * @returns true if in production mode, false otherwise
 *
 * @example
 * ```typescript
 * if (isProduction()) {
 *   enableAnalytics()
 * }
 * ```
 */
export const isProduction = (() => {
  let cached: boolean | undefined;

  return (): boolean => {
    if (cached === undefined) {
      cached = getImportMetaEnv()?.PROD === true;
    }
    return cached;
  };
})();

/**
 * Check if the code is running in a test environment
 *
 * @returns true if in test mode (NODE_ENV=test or vitest/jest detected)
 */
export const isTest = (() => {
  let cached: boolean | undefined;

  return (): boolean => {
    if (cached === undefined) {
      const importMetaEnv = getImportMetaEnv();
      cached =
        importMetaEnv?.MODE === "test" ||
        importMetaEnv?.NODE_ENV === "test" ||
        (typeof process !== "undefined" && process.env?.NODE_ENV === "test") ||
        (typeof globalThis !== "undefined" &&
          // Vitest detection
          ("__vitest_worker__" in globalThis ||
            // Jest detection
            "jest" in globalThis));
    }
    return cached;
  };
})();

// =============================================================================
// BACKWARDS COMPATIBILITY EXPORTS
// =============================================================================

/** @deprecated Use {@link clamp} instead */
export const calculatePercentageWithinBounds = clamp;

/** @deprecated Use {@link generateUniqueId} instead */
export const generateUniqueIdentifier = (prefix = "id"): string =>
  generateUniqueId({ prefix });

/** @deprecated Use {@link isInRange} instead */
export const validateNumericRange = (
  value: number,
  min: number,
  max: number,
): boolean => {
  validateNumericInputs({ value, min, max });
  validateRangeOrder(min, max);
  return value >= min && value <= max;
};

/** @deprecated Use {@link shuffle} instead */
export const transformArrayToRandomOrder = shuffle;

/** @deprecated Use {@link distanceBetween} instead */
export const calculateDistanceBetweenPoints = (
  firstPointX: number,
  firstPointY: number,
  secondPointX: number,
  secondPointY: number,
): number =>
  distanceBetween(
    { x: firstPointX, y: firstPointY },
    { x: secondPointX, y: secondPointY },
  );

/** @deprecated Use {@link circlesCollide} instead */
export const determineCircularCollision = (
  firstObjectX: number,
  firstObjectY: number,
  firstObjectRadius: number,
  secondObjectX: number,
  secondObjectY: number,
  secondObjectRadius: number,
): boolean =>
  circlesCollide(
    { x: firstObjectX, y: firstObjectY, radius: firstObjectRadius },
    { x: secondObjectX, y: secondObjectY, radius: secondObjectRadius },
  );

/** @deprecated Use {@link formatDuration} instead */
export const formatMillisecondsAsMinutesSeconds = formatDuration;

/** @deprecated Use {@link calculatePercentage} instead */
export const calculatePercentageCompletion = (
  current: number,
  target: number,
  decimalPlaces = 0,
): number => calculatePercentage(current, target, { decimalPlaces });

/** @deprecated Use {@link randomFloat} instead */
export const generateRandomNumberInRange = randomFloat;

/** @deprecated Use {@link randomInt} instead */
export const generateRandomIntegerInRange = randomInt;

/** @deprecated Use {@link debounce} instead */
export const createDebouncedFunction = debounce;

/** @deprecated Use {@link throttle} instead */
export const createThrottledFunction = <T extends (...args: unknown[]) => void>(
  fn: T,
  interval: number,
) => throttle(fn, interval, { leading: true, trailing: false });

/** @deprecated Use {@link deepClone} instead */
export const createDeepClone = deepClone;

/** @deprecated Use {@link isDevelopment} instead */
export const isRunningInDevelopmentMode = isDevelopment;

/** @deprecated Use {@link isProduction} instead */
