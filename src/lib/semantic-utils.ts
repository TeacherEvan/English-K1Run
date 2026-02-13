/**
 * Semantic Utility Functions - Production-grade helper utilities
 *
 * This module re-exports utility functions from focused modules.
 * Functions are organized by category for better maintainability.
 *
 * @module semantic-utils
 */

// Math utilities
export {
  calculatePercentageWithinBounds,
  validateNumericRange,
  calculateDistanceBetweenPoints,
  determineCircularCollision,
  calculatePercentageCompletion,
  generateRandomNumberInRange,
  generateRandomIntegerInRange,
} from "./utils/math-utils";

// Array utilities
export { transformArrayToRandomOrder } from "./utils/array-utils";

// String utilities
export {
  generateUniqueIdentifier,
  formatMillisecondsAsMinutesSeconds,
} from "./utils/string-utils";

// Timing utilities
export {
  createDebouncedFunction,
  createThrottledFunction,
} from "./utils/timing-utils";

// Object utilities
export { createDeepClone } from "./utils/object-utils";

// Environment utilities
export {
  isRunningInDevelopmentMode,
  isRunningInProductionMode,
} from "./utils/env-utils";

