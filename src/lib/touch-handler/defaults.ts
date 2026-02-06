/**
 * Default configuration for multi-touch handling.
 */

import type { TouchHandlerOptions } from "./types";

export const DEFAULT_TOUCH_HANDLER_OPTIONS: Required<TouchHandlerOptions> = {
  debounceMs: 150,
  tapThresholdMs: 300,
  movementThresholdPx: 10,
  debug: false,
};

export const resolveTouchHandlerOptions = (
  options: TouchHandlerOptions = {},
): Required<TouchHandlerOptions> => ({
  debounceMs: options.debounceMs ?? DEFAULT_TOUCH_HANDLER_OPTIONS.debounceMs,
  tapThresholdMs:
    options.tapThresholdMs ?? DEFAULT_TOUCH_HANDLER_OPTIONS.tapThresholdMs,
  movementThresholdPx:
    options.movementThresholdPx ??
    DEFAULT_TOUCH_HANDLER_OPTIONS.movementThresholdPx,
  debug: options.debug ?? DEFAULT_TOUCH_HANDLER_OPTIONS.debug,
});
