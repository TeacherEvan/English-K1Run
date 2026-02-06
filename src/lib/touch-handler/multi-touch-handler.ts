/**
 * MultiTouchHandler implements debounced, multi-pointer tap handling.
 */

import { resolveTouchHandlerOptions } from "./defaults";
import {
  cleanupOldTaps,
  handleMouseClick,
  handleTouchEnd,
  handleTouchStart,
} from "./handlers";
import { createTouchTelemetry } from "./touch-telemetry";
import type {
  TouchHandlerOptions,
  TouchHandlerStats,
  TouchPoint,
} from "./types";

export class MultiTouchHandler {
  private activeTouches = new Map<number, TouchPoint>();
  private recentTaps = new Map<string, number>();
  private options: Required<TouchHandlerOptions>;
  private enabled = false;
  private cleanupIntervalId: number | null = null;
  private telemetry: ReturnType<typeof createTouchTelemetry>;

  constructor(options: TouchHandlerOptions = {}) {
    this.options = resolveTouchHandlerOptions(options);
    this.telemetry = createTouchTelemetry(this.options);
  }

  /** Initialize the touch handler - call when gameplay starts. */
  enable() {
    if (this.enabled) return;
    this.enabled = true;
    this.activeTouches.clear();
    this.recentTaps.clear();
    this.startCleanupInterval();

    this.telemetry.log(
      "[MultiTouchHandler] Enabled with options:",
      this.options,
    );

    this.telemetry.track({
      type: "info",
      category: "touch_handler",
      message: "Touch handler enabled",
      data: {
        debounceMs: this.options.debounceMs,
        tapThresholdMs: this.options.tapThresholdMs,
      },
    });
  }

  /** Disable the touch handler - call when gameplay ends. */
  disable() {
    if (!this.enabled) return;
    this.enabled = false;
    this.activeTouches.clear();
    this.recentTaps.clear();
    this.stopCleanupInterval();

    this.telemetry.log("[MultiTouchHandler] Disabled");

    this.telemetry.track({
      type: "info",
      category: "touch_handler",
      message: "Touch handler disabled",
    });
  }

  /** Handle touch start event - registers new touch points. */
  handleTouchStart(event: TouchEvent, targetId: string): boolean {
    if (!this.enabled) return false;
    return handleTouchStart(
      {
        activeTouches: this.activeTouches,
        recentTaps: this.recentTaps,
        options: this.options,
        telemetry: this.telemetry,
      },
      event,
      targetId,
    );
  }

  /**
   * Handle touch end event - validates and processes taps.
   * Returns true if this is a valid tap that should trigger game logic.
   */
  handleTouchEnd(event: TouchEvent, targetId: string): boolean {
    if (!this.enabled) return false;
    return handleTouchEnd(
      {
        activeTouches: this.activeTouches,
        recentTaps: this.recentTaps,
        options: this.options,
        telemetry: this.telemetry,
      },
      event,
      targetId,
    );
  }

  /** Handle mouse click for desktop compatibility. */
  handleMouseClick(targetId: string): boolean {
    if (!this.enabled) return false;
    return handleMouseClick(
      {
        activeTouches: this.activeTouches,
        recentTaps: this.recentTaps,
        options: this.options,
        telemetry: this.telemetry,
      },
      targetId,
    );
  }

  /** Get current touch statistics (for debugging). */
  getStats(): TouchHandlerStats {
    return {
      activeTouches: this.activeTouches.size,
      recentTaps: this.recentTaps.size,
      enabled: this.enabled,
      options: this.options,
    };
  }

  /** Clean up old recent taps to prevent memory bloat. */
  cleanupOldTaps() {
    cleanupOldTaps({
      activeTouches: this.activeTouches,
      recentTaps: this.recentTaps,
      options: this.options,
      telemetry: this.telemetry,
    });
  }

  private startCleanupInterval() {
    if (this.cleanupIntervalId !== null) return;
    this.cleanupIntervalId = window.setInterval(() => {
      this.cleanupOldTaps();
    }, 5000);
  }

  private stopCleanupInterval() {
    if (this.cleanupIntervalId !== null) {
      window.clearInterval(this.cleanupIntervalId);
      this.cleanupIntervalId = null;
    }
  }
}
