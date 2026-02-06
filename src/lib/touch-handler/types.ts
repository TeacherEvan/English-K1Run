/**
 * Shared types for multi-touch input handling.
 */

export interface TouchPoint {
  id: number;
  x: number;
  y: number;
  startTime: number;
  targetId?: string;
  processed: boolean;
}

export interface TouchHandlerOptions {
  /** Minimum time (ms) between duplicate taps on the same target. */
  debounceMs?: number;
  /** Maximum time (ms) for a touch to be considered a tap (not a drag). */
  tapThresholdMs?: number;
  /** Maximum pixel movement allowed for a touch to be considered a tap. */
  movementThresholdPx?: number;
  /** Enable detailed console logging for debugging. */
  debug?: boolean;
}

export interface TouchHandlerStats {
  activeTouches: number;
  recentTaps: number;
  enabled: boolean;
  options: Required<TouchHandlerOptions>;
}
