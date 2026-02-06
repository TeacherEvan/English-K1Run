/**
 * Touch event handlers and cleanup helpers.
 */

import type { TouchTelemetry } from "./touch-telemetry";
import { getTouchMovement, isValidTap } from "./touch-utils";
import type { TouchHandlerOptions, TouchPoint } from "./types";

interface HandlerState {
  activeTouches: Map<number, TouchPoint>;
  recentTaps: Map<string, number>;
  options: Required<TouchHandlerOptions>;
  telemetry: TouchTelemetry;
}

export const handleTouchStart = (
  state: HandlerState,
  event: TouchEvent,
  targetId: string,
): boolean => {
  const touches = event.changedTouches;
  let anyRegistered = touches.length > 0;

  for (let i = 0; i < touches.length; i++) {
    const touch = touches[i];
    const touchPoint: TouchPoint = {
      id: touch.identifier,
      x: touch.clientX,
      y: touch.clientY,
      startTime: Date.now(),
      targetId,
      processed: false,
    };

    state.activeTouches.set(touch.identifier, touchPoint);
    anyRegistered = true;

    state.telemetry.log(
      `[MultiTouchHandler] Touch started: ID=${touch.identifier}, Target=${targetId}, Active=${state.activeTouches.size}`,
    );
  }

  state.telemetry.track({
    type: "user_action",
    category: "touch_handler",
    message: "Touch started",
    data: {
      touchCount: state.activeTouches.size,
      targetId,
    },
  });

  return anyRegistered;
};

export const handleTouchEnd = (
  state: HandlerState,
  event: TouchEvent,
  targetId: string,
): boolean => {
  const touches = event.changedTouches;
  let validTapDetected = false;

  for (let i = 0; i < touches.length; i++) {
    const touch = touches[i];
    const touchPoint = state.activeTouches.get(touch.identifier);

    if (!touchPoint) continue;

    if (touchPoint.processed) {
      state.activeTouches.delete(touch.identifier);
      continue;
    }

    const now = Date.now();
    const duration = now - touchPoint.startTime;
    const { movement } = getTouchMovement(touch, touchPoint.x, touchPoint.y);

    if (isValidTap(duration, movement, state.options)) {
      const lastTapTime = state.recentTaps.get(targetId) || 0;
      const timeSinceLastTap = now - lastTapTime;

      if (timeSinceLastTap >= state.options.debounceMs) {
        validTapDetected = true;
        touchPoint.processed = true;
        state.recentTaps.set(targetId, now);

        state.telemetry.log(
          `[MultiTouchHandler] Valid tap: ID=${touch.identifier}, Target=${targetId}, Duration=${duration}ms, Movement=${movement.toFixed(1)}px`,
        );

        state.telemetry.track({
          type: "user_action",
          category: "touch_handler",
          message: "Valid tap detected",
          data: {
            touchId: touch.identifier,
            targetId,
            duration,
            movement: Math.round(movement),
          },
        });
      } else {
        state.telemetry.log(
          `[MultiTouchHandler] Debounced tap: Target=${targetId}, TimeSince=${timeSinceLastTap}ms`,
        );

        state.telemetry.track({
          type: "info",
          category: "touch_handler",
          message: "Tap debounced",
          data: {
            targetId,
            timeSinceLastTap,
          },
        });
      }
    } else {
      const reason =
        duration >= state.options.tapThresholdMs ? "long_press" : "drag";

      state.telemetry.log(
        `[MultiTouchHandler] Invalid tap (drag/long-press): ID=${touch.identifier}, Duration=${duration}ms, Movement=${movement.toFixed(1)}px`,
      );

      state.telemetry.track({
        type: "info",
        category: "touch_handler",
        message: "Invalid tap (drag or long-press)",
        data: {
          touchId: touch.identifier,
          duration,
          movement: Math.round(movement),
          reason,
        },
      });
    }

    state.activeTouches.delete(touch.identifier);
  }

  return validTapDetected;
};

export const handleMouseClick = (
  state: HandlerState,
  targetId: string,
): boolean => {
  const now = Date.now();
  const lastTapTime = state.recentTaps.get(targetId) || 0;
  const timeSinceLastTap = now - lastTapTime;

  if (timeSinceLastTap >= state.options.debounceMs) {
    state.recentTaps.set(targetId, now);

    state.telemetry.log(
      `[MultiTouchHandler] Valid mouse click: Target=${targetId}`,
    );

    state.telemetry.track({
      type: "user_action",
      category: "touch_handler",
      message: "Valid click detected",
      data: { targetId },
    });
    return true;
  }

  state.telemetry.log(
    `[MultiTouchHandler] Debounced mouse click: Target=${targetId}`,
  );

  state.telemetry.track({
    type: "info",
    category: "touch_handler",
    message: "Click debounced",
    data: {
      targetId,
      timeSinceLastTap,
    },
  });
  return false;
};

export const cleanupOldTaps = (state: HandlerState) => {
  const now = Date.now();
  const cleanupThreshold = state.options.debounceMs * 10;

  for (const [targetId, timestamp] of state.recentTaps.entries()) {
    if (now - timestamp > cleanupThreshold) {
      state.recentTaps.delete(targetId);
    }
  }

  if (state.options.debug && state.recentTaps.size > 0) {
    state.telemetry.log(
      `[MultiTouchHandler] Cleanup: ${state.recentTaps.size} recent taps remaining`,
    );
  }
};
