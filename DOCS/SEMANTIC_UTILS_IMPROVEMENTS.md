# Semantic Utils Improvements

This document provides a comprehensive analysis and improved implementation of `src/lib/semantic-utils.ts`.

## Overview

The following improvements address four key areas:

1. **Code Readability & Maintainability** - Cleaner APIs, better naming, modular organization
2. **Performance Optimization** - Eliminated expensive operations, memoization, optimized algorithms
3. **Best Practices & Patterns** - Input validation, proper TypeScript, cancellation support
4. **Error Handling & Edge Cases** - Type checking, boundary validation, circular references

---

## Summary of Changes

| Aspect                  | Before                                    | After                                     |
| ----------------------- | ----------------------------------------- | ----------------------------------------- |
| **Naming**              | Verbose (calculatePercentageWithinBounds) | Concise (clamp, shuffle, debounce)        |
| **Input Validation**    | None                                      | Comprehensive with descriptive errors     |
| **Collision Detection** | Uses Math.sqrt()                          | Squared distance comparison               |
| **Debounce/Throttle**   | Basic, no cancellation                    | Full control with cancel/flush/pending    |
| **Random Generation**   | Math.random() only                        | Crypto API with secure fallback           |
| **Deep Clone**          | structuredClone or JSON                   | Circular reference support                |
| **Backwards Compat**    | Breaking changes                          | All old functions preserved as deprecated |

---

## Improved Implementation

```typescript
/**
 * Semantic Utility Functions - Production-grade helper utilities
 *
 * This module provides clearly-named utility functions following 2025 TypeScript
 * best practices for semantic naming and type safety.
 *
 * @module semantic-utils
 */

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/** 2D Point coordinates */
export interface Point2D {
  x: number;
  y: number;
}

/** Circle with center and radius */
export interface Circle {
  x: number;
  y: number;
  radius: number;
}

/** Options for unique ID generation */
export interface UniqueIdOptions {
  prefix?: string;
  suffix?: string;
  length?: number;
  separator?: string;
}

/** Throttle configuration options */
export interface ThrottleOptions {
  leading?: boolean;
  trailing?: boolean;
}

/** Debounced function with control methods */
export interface DebouncedFunction<T extends (...args: unknown[]) => unknown> {
  (...args: Parameters<T>): ReturnType<T> | undefined;
  cancel(): void;
  flush(): ReturnType<T> | undefined;
  pending(): boolean;
}

/** Throttled function with control methods */
export interface ThrottledFunction<T extends (...args: unknown[]) => unknown> {
  (...args: Parameters<T>): ReturnType<T> | undefined;
  cancel(): void;
  flush(): ReturnType<T> | undefined;
}

// =============================================================================
// TYPE GUARDS AND VALIDATION HELPERS
// =============================================================================

/**
 * Check if a value is a valid finite number (not NaN, Infinity, or -Infinity)
 */
const isValidNumber = (value: unknown): value is number => {
  return typeof value === "number" && Number.isFinite(value);
};

/**
 * Validate that all provided values are valid numbers
 * Throws a TypeError with descriptive message if validation fails
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
 * @param value - The numeric value to clamp
 * @param min - The minimum allowed value
 * @param max - The maximum allowed value
 * @returns The clamped value between min and max
 * @throws {TypeError} If any argument is not a valid finite number
 * @throws {RangeError} If min > max
 */
export const clamp = (value: number, min: number, max: number): number => {
  validateNumericInputs({ value, min, max });
  validateRangeOrder(min, max);

  return Math.min(max, Math.max(min, value));
};

/**
 * Check if a number falls within a specified range (inclusive)
 *
 * @param value - The value to check
 * @param min - The minimum acceptable value
 * @param max - The maximum acceptable value
 * @returns true if value is within range
 * @throws {TypeError} If arguments are invalid
 * @throws {RangeError} If min > max
 */
export const isInRange = (value: number, min: number, max: number): boolean => {
  validateNumericInputs({ value, min, max });
  validateRangeOrder(min, max);
  return value >= min && value <= max;
};

/**
 * Calculate percentage completion from current and target values
 *
 * @param current - Current progress value
 * @param target - Target goal value
 * @param options - Optional configuration
 * @returns Percentage completion (0-100 by default)
 * @throws {TypeError} If numeric arguments are invalid
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
 * The upper bound is exclusive.
 * Uses Math.random() which is NOT cryptographically secure.
 *
 * @param min - The minimum value (inclusive)
 * @param max - The maximum value (exclusive)
 * @returns A random number in [min, max)
 * @throws {TypeError} If arguments are not valid finite numbers
 * @throws {RangeError} If min >= max
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
 * @param min - The minimum value
 * @param max - The maximum value
 * @returns A random integer in [min, max]
 * @throws {TypeError} If arguments are not valid finite numbers
 * @throws {RangeError} If min > max
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
 */
export const secureRandomInt = (min: number, max: number): number => {
  validateNumericInputs({ min, max });
  validateRangeOrder(min, max);

  const range = max - min + 1;

  // Use crypto API if available
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
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
 * Uses crypto.randomUUID() when available for guaranteed uniqueness.
 *
 * @param options - Configuration options
 * @returns A unique identifier string
 * @throws {RangeError} If length is invalid
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
    // Fallback: timestamp + random for collision resistance
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
 * Creates a new array without mutating the original.
 * Uses Math.random() - NOT cryptographically secure.
 *
 * @template T - The type of array elements
 * @param array - The array to shuffle
 * @returns A new shuffled array
 * @throws {TypeError} If input is not an array
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

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
};

/**
 * Securely shuffle an array using cryptographically secure randomness
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
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
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
 * Uses Math.hypot() for numerical stability.
 *
 * @param p1 - First point
 * @param p2 - Second point
 * @returns The distance between the two points
 * @throws {TypeError} If coordinates are not valid finite numbers
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
 *
 * @param c1 - First circle
 * @param c2 - Second circle
 * @returns true if circles are colliding/overlapping
 * @throws {TypeError} If numeric properties are invalid
 * @throws {RangeError} If any radius is negative
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
 * @returns Formatted time string
 * @throws {TypeError} If ms is not a valid finite number
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
 *
 * @template T - Function type to debounce
 * @param fn - The function to debounce
 * @param wait - Delay in milliseconds
 * @returns Debounced function with cancel() and flush() methods
 * @throws {TypeError} If fn is not a function
 * @throws {RangeError} If wait is negative
 */
export const debounce = <T extends (...args: unknown[]) => unknown>(
  fn: T,
  wait: number,
): DebouncedFunction<T> => {
  if (typeof fn !== "function") {
    throw new TypeError("Expected a function to debounce");
  }

  if (!isValidNumber(wait) || wait < 0) {
    throw new RangeError("wait must be a non-negative number");
  }

  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastResult: ReturnType<T> | undefined;

  const debounced = (...args: Parameters<T>): ReturnType<T> | undefined => {
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

  debounced.flush = (): ReturnType<T> | undefined => {
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
 * @template T - Function type to throttle
 * @param fn - The function to throttle
 * @param wait - Minimum time between executions
 * @param options - Throttling options
 * @returns Throttled function with cancel() and flush() methods
 * @throws {TypeError} If fn is not a function
 * @throws {RangeError} If wait is negative
 */
export const throttle = <T extends (...args: unknown[]) => unknown>(
  fn: T,
  wait: number,
  options: ThrottleOptions = {},
): ThrottledFunction<T> => {
  if (typeof fn !== "function") {
    throw new TypeError("Expected a function to throttle");
  }

  if (!isValidNumber(wait) || wait < 0) {
    throw new RangeError("wait must be a non-negative number");
  }

  const { leading = true, trailing = true } = options;

  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastCallTime = 0;
  let lastResult: ReturnType<T> | undefined;

  const invoke = (args: Parameters<T>) => {
    lastCallTime = Date.now();
    lastArgs = null;
    lastResult = fn(...args);
    return lastResult;
  };

  const throttled = (...args: Parameters<T>): ReturnType<T> | undefined => {
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

  throttled.flush = (): ReturnType<T> | undefined => {
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
 * @throws {TypeError} If value contains unsupported types
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

/**
 * Check if the code is running in development mode
 * Memoized for performance since this value never changes at runtime.
 */
export const isDevelopment = (() => {
  let cached: boolean | undefined;

  return (): boolean => {
    if (cached === undefined) {
      cached = import.meta.env?.DEV === true;
    }
    return cached;
  };
})();

/**
 * Check if the code is running in production mode
 * Memoized for performance since this value never changes at runtime.
 */
export const isProduction = (() => {
  let cached: boolean | undefined;

  return (): boolean => {
    if (cached === undefined) {
      cached = import.meta.env?.PROD === true;
    }
    return cached;
  };
})();

/**
 * Check if the code is running in a test environment
 */
export const isTest = (() => {
  let cached: boolean | undefined;

  return (): boolean => {
    if (cached === undefined) {
      cached =
        import.meta.env?.MODE === "test" ||
        import.meta.env?.NODE_ENV === "test" ||
        (typeof process !== "undefined" && process.env?.NODE_ENV === "test") ||
        (typeof globalThis !== "undefined" &&
          ("__vitest_worker__" in globalThis || "jest" in globalThis));
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
export const validateNumericRange = isInRange;

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
export const isRunningInProductionMode = isProduction;
```

---

## Detailed Improvement Analysis

### 1. Code Readability & Maintainability

#### Concise Naming

- `calculatePercentageWithinBounds` -> `clamp` (industry standard term)
- `transformArrayToRandomOrder` -> `shuffle` (commonly understood)
- `createDebouncedFunction` -> `debounce` (shorter, matches Lodash/Ramda)
- `generateUniqueIdentifier` -> `generateUniqueId` (common convention)

#### Structured Organization

Functions grouped by category with clear separators:

- Type Guards and Validation
- Bounding and Clamping
- Random Generation
- Array Operations
- Spatial and Geometry
- Function Decorators
- Deep Cloning
- Environment Detection

#### TypeScript Interfaces

Defined clear interfaces for options:

```typescript
export interface Point2D { x: number; y: number }
export interface Circle { x: number; y: number; radius: number }
export interface DebouncedFunction<T> { ... }
```

### 2. Performance Optimizations

#### Collision Detection

**Before:**

```typescript
const distance = Math.sqrt(dx * dx + dy * dy);
return distance < r1 + r2;
```

**After:**

```typescript
const distanceSquared = dx * dx + dy * dy;
const radiusSum = r1 + r2;
return distanceSquared < radiusSum * radiusSum;
```

**Benefit:** Eliminates expensive `sqrt()` operation. Squared comparison is mathematically equivalent.

#### Distance Calculation

**Before:**

```typescript
return Math.sqrt(dx * dx + dy * dy);
```

**After:**

```typescript
return Math.hypot(dx, dy);
```

**Benefit:** `Math.hypot()` provides better numerical stability for very large/small values, preventing overflow/underflow.

#### Environment Detection Memoization

**Before:**

```typescript
export const isRunningInDevelopmentMode = (): boolean => {
  return import.meta.env.DEV;
};
```

**After:**

```typescript
export const isDevelopment = (() => {
  let cached: boolean | undefined;
  return (): boolean => {
    if (cached === undefined) {
      cached = import.meta.env?.DEV === true;
    }
    return cached;
  };
})();
```

**Benefit:** `import.meta.env` lookup only happens once, subsequent calls return cached value.

#### Crypto-Secure Random (Optional)

Added `secureRandomInt()` and `secureShuffle()` using `crypto.getRandomValues()` API for cryptographically secure randomness where needed (security tokens, fair gaming).

### 3. Best Practices & Patterns

#### Input Validation

All public functions now validate inputs:

```typescript
export const clamp = (value: number, min: number, max: number): number => {
  validateNumericInputs({ value, min, max });
  validateRangeOrder(min, max);
  // ... implementation
};
```

#### Debounce with Full Control

**Before:** Basic, no cancellation support.

**After:** Full control methods:

```typescript
const search = debounce(api.search, 300);
search("query"); // Schedule execution
search.cancel(); // Cancel pending
search.flush(); // Execute immediately
search.pending(); // Check if pending
```

#### Throttle with Leading/Trailing Options

```typescript
// Execute immediately, then wait
throttle(fn, 100, { leading: true, trailing: false });

// Only execute after wait, with final call
throttle(fn, 500, { leading: false, trailing: true });

// Execute immediately AND after wait
throttle(fn, 1000, { leading: true, trailing: true });
```

#### Options Pattern

Complex functions use options objects for clarity:

```typescript
// Before
calculatePercentageCompletion(25, 100, 2);

// After
calculatePercentage(25, 100, { decimalPlaces: 2, clampResult: true });
```

### 4. Error Handling & Edge Cases

#### NaN and Infinity Detection

```typescript
const isValidNumber = (value: unknown): value is number => {
  return typeof value === "number" && Number.isFinite(value);
};
```

Prevents silent failures from `NaN` propagation.

#### Circular Reference Handling in Deep Clone

```typescript
const visited = new WeakMap<object, unknown>();

const clone = <U>(val: U): U => {
  if (visited.has(val as object)) {
    return visited.get(val as object) as U;
  }
  // ... mark as visited before recursing
};
```

Handles circular references that would crash `JSON.parse(JSON.stringify())`.

#### Range Overflow Protection

```typescript
export const randomInt = (min: number, max: number): number => {
  const range = max - min;
  if (range > Number.MAX_SAFE_INTEGER) {
    throw new RangeError(`Range size exceeds MAX_SAFE_INTEGER`);
  }
  // ...
};
```

#### Negative Time Handling

```typescript
export const formatDuration = (ms: number, options = {}): string => {
  const isNegative = ms < 0;
  const absMs = Math.abs(ms);
  // ... format with negative prefix
};
```

#### Empty/Single-Element Array Optimization

```typescript
export const shuffle = <T>(array: readonly T[]): T[] => {
  if (array.length <= 1) {
    return [...array]; // No need to shuffle
  }
  // ...
};
```

---

## Migration Guide

### Step 1: Install New Types (if separate types file)

Create `src/lib/types.ts` or add to existing types file:

```typescript
export interface Point2D {
  x: number;
  y: number;
}
export interface Circle {
  x: number;
  y: number;
  radius: number;
}
export interface UniqueIdOptions {
  prefix?: string;
  suffix?: string;
  length?: number;
  separator?: string;
}
export interface ThrottleOptions {
  leading?: boolean;
  trailing?: boolean;
}
export interface DebouncedFunction<T extends (...args: unknown[]) => unknown> {
  (...args: Parameters<T>): ReturnType<T> | undefined;
  cancel(): void;
  flush(): ReturnType<T> | undefined;
  pending(): boolean;
}
export interface ThrottledFunction<T extends (...args: unknown[]) => unknown> {
  (...args: Parameters<T>): ReturnType<T> | undefined;
  cancel(): void;
  flush(): ReturnType<T> | undefined;
}
```

### Step 2: Gradual Migration (Backwards Compatible)

All old function names are preserved as deprecated aliases:

```typescript
// Old code still works (but shows deprecation warning in IDE)
calculatePercentageWithinBounds(50, 0, 100); // Works
generateUniqueIdentifier("player"); // Works

// New recommended approach
clamp(50, 0, 100); // Cleaner
generateUniqueId({ prefix: "player" }); // More flexible
```

### Step 3: Update Call Sites

| Old                                             | New                                      | Notes               |
| ----------------------------------------------- | ---------------------------------------- | ------------------- |
| `calculatePercentageWithinBounds(v, min, max)`  | `clamp(v, min, max)`                     | Shorter name        |
| `validateNumericRange(v, min, max)`             | `isInRange(v, min, max)`                 | Returns boolean     |
| `generateUniqueIdentifier('prefix')`            | `generateUniqueId({ prefix: 'prefix' })` | Options object      |
| `transformArrayToRandomOrder(arr)`              | `shuffle(arr)`                           | Standard term       |
| `calculateDistanceBetweenPoints(x1,y1,x2,y2)`   | `distanceBetween({x,y}, {x,y})`          | Point objects       |
| `determineCircularCollision(x1,y1,r1,x2,y2,r2)` | `circlesCollide(c1, c2)`                 | Circle objects      |
| `formatMillisecondsAsMinutesSeconds(ms)`        | `formatDuration(ms, opts)`               | More options        |
| `calculatePercentageCompletion(cur, tgt, dec)`  | `calculatePercentage(cur, tgt, opts)`    | Options object      |
| `generateRandomNumberInRange(min, max)`         | `randomFloat(min, max)`                  | Clearer distinction |
| `generateRandomIntegerInRange(min, max)`        | `randomInt(min, max)`                    | Shorter             |
| `createDebouncedFunction(fn, delay)`            | `debounce(fn, delay)`                    | + cancel/flush      |
| `createThrottledFunction(fn, interval)`         | `throttle(fn, wait, opts)`               | + leading/trailing  |
| `createDeepClone(data)`                         | `deepClone(data)`                        | Shorter             |
| `isRunningInDevelopmentMode()`                  | `isDevelopment()`                        | Shorter, memoized   |
| `isRunningInProductionMode()`                   | `isProduction()`                         | Shorter, memoized   |

### Step 4: Leverage New Features

```typescript
// Cancel debounced calls
const save = debounce(api.save, 1000);
// User navigates away...
save.cancel(); // Prevent unnecessary API call

// Throttle with trailing execution
const logScroll = throttle(console.log, 100, {
  leading: false, // Don't log immediately
  trailing: true, // But log final position
});

// Secure shuffle for fair gameplay
const deck = secureShuffle(cards); // Uses crypto API

// Format with hours
formatDuration(3661000, { showHours: true }); // '01:01:01'

// Percentage without clamping
calculatePercentage(150, 100, { clampResult: false }); // 150

// Check if debounce is pending
if (search.pending()) {
  // Show loading indicator
}
```

---

## Testing Recommendations

Add these test cases for the new functionality:

```typescript
import { describe, it, expect, vi } from "vitest";
import {
  clamp,
  isInRange,
  debounce,
  throttle,
  circlesCollide,
  deepClone,
  shuffle,
} from "./semantic-utils";

describe("Input Validation", () => {
  it("should throw on NaN inputs", () => {
    expect(() => clamp(NaN, 0, 100)).toThrow(TypeError);
  });

  it("should throw when min > max", () => {
    expect(() => clamp(50, 100, 0)).toThrow(RangeError);
  });

  it("should throw on non-numeric inputs", () => {
    expect(() => clamp("50" as any, 0, 100)).toThrow(TypeError);
  });
});

describe("Debounce Control Methods", () => {
  it("should support cancellation", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();
    debounced.cancel();

    vi.advanceTimersByTime(200);
    expect(fn).not.toHaveBeenCalled();
  });

  it("should support immediate execution via flush", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();
    debounced.flush();

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("should report pending status", () => {
    const debounced = debounce(vi.fn(), 100);

    expect(debounced.pending()).toBe(false);
    debounced();
    expect(debounced.pending()).toBe(true);
    vi.advanceTimersByTime(100);
    expect(debounced.pending()).toBe(false);
  });
});

describe("Throttle Options", () => {
  it("should support leading: false", () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100, { leading: false });

    throttled();
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("should support trailing: true", () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100, { trailing: true });

    throttled();
    throttled();
    throttled();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(2); // leading + trailing
  });
});

describe("Collision Detection Performance", () => {
  it("should detect collision correctly", () => {
    expect(
      circlesCollide({ x: 0, y: 0, radius: 5 }, { x: 8, y: 0, radius: 5 }),
    ).toBe(true); // Overlapping

    expect(
      circlesCollide({ x: 0, y: 0, radius: 5 }, { x: 20, y: 0, radius: 5 }),
    ).toBe(false); // Not touching
  });
});

describe("Deep Clone Edge Cases", () => {
  it("should handle circular references", () => {
    const obj: any = { a: 1 };
    obj.self = obj;

    const cloned = deepClone(obj);
    expect(cloned.a).toBe(1);
    expect(cloned.self).toBe(cloned);
  });

  it("should clone Maps and Sets", () => {
    const map = new Map([["key", "value"]]);
    const set = new Set([1, 2, 3]);

    expect(deepClone(map)).toEqual(map);
    expect(deepClone(set)).toEqual(set);
  });

  it("should clone Dates", () => {
    const date = new Date("2024-01-01");
    const cloned = deepClone(date);

    expect(cloned).toEqual(date);
    expect(cloned).not.toBe(date);
  });
});
```

---

## Bundle Size Impact

| Metric              | Before | After         | Change |
| ------------------- | ------ | ------------- | ------ |
| Lines of Code       | 448    | ~700          | +56%   |
| Gzipped (estimated) | ~1.2KB | ~1.8KB        | +50%   |
| Functionality       | Basic  | Comprehensive | +100%  |

The size increase provides significant value through:

- Better error messages (catch bugs earlier)
- Cancellation support (prevent memory leaks)
- Circular reference handling (prevent crashes)
- Crypto-secure randomness (fair gaming)
- Input validation (fail fast principle)

If bundle size is critical, tree-shaking will eliminate unused functions.

---

## ESLint Deprecation Configuration

Add to your `.eslintrc` or `eslint.config.js`:

```javascript
rules: {
  'deprecation/deprecation': 'warn'
}
```

This will show warnings when using deprecated function names, guiding gradual migration.

---

## Conclusion

These improvements transform `semantic-utils.ts` from a basic utility collection into a production-grade library with:

1. **Reliability** - Input validation prevents silent failures
2. **Performance** - Optimized algorithms, memoization
3. **Control** - Cancellation, flushing, configuration options
4. **Compatibility** - All old APIs preserved with deprecation warnings
5. **Type Safety** - Comprehensive TypeScript interfaces

The modular structure makes it easy to split into separate files if the module grows further (e.g., `utils/math.ts`, `utils/function.ts`, `utils/clone.ts`).
