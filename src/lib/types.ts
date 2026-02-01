/**
 * Shared Type Definitions
 *
 * Central type definitions used across the application.
 * @module types
 */

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
