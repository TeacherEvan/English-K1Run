/**
 * Multi-touch handler entry point.
 */

import { DEFAULT_TOUCH_HANDLER_OPTIONS } from "./touch-handler/defaults";
import { MultiTouchHandler } from "./touch-handler/multi-touch-handler";

export type {
  TouchHandlerOptions,
  TouchHandlerStats,
  TouchPoint,
} from "./touch-handler/types";

// Global singleton instance.
export const multiTouchHandler = new MultiTouchHandler({
  debounceMs: DEFAULT_TOUCH_HANDLER_OPTIONS.debounceMs,
  tapThresholdMs: DEFAULT_TOUCH_HANDLER_OPTIONS.tapThresholdMs,
  movementThresholdPx: DEFAULT_TOUCH_HANDLER_OPTIONS.movementThresholdPx,
  debug: import.meta.env.DEV,
});
