/**
 * Event tracking facade (Telemetry Adapter)
 *
 * Layering rule: gameplay mechanics may call `eventTracker`, but telemetry must
 * never throw or corrupt simulation state.
 */

import { audioEventTracker } from "./event-metrics/audio-event-tracker";
import { emojiTracker } from "./event-metrics/emoji-tracker";
import { performanceTracker } from "./event-metrics/performance-tracker";
import {
  attachGlobalErrorHandlers,
  exposeTrackerForDebugging,
} from "./event-tracker/browser-wiring";
import { EventTracker } from "./event-tracker/event-tracker";
import { generateUniqueIdentifier } from "./semantic-utils";

// Re-export subsystem types and singletons for backward compatibility
export type {
  AudioPlaybackEvent,
  EmojiAppearanceStats,
  EmojiLifecycleEvent,
  PerformanceMetrics,
} from "./event-metrics";

export { audioEventTracker, emojiTracker, performanceTracker };

export { EventTracker } from "./event-tracker/event-tracker";
export type { GameEvent } from "./event-tracker/types";

const isDev = Boolean(import.meta.env?.DEV);

export const eventTracker = new EventTracker({
  isDev,
  generateId: () => generateUniqueIdentifier("event"),
  now: () => Date.now(),
  userAgent: () =>
    typeof navigator !== "undefined" ? navigator.userAgent : undefined,
  url: () => (typeof window !== "undefined" ? window.location.href : undefined),
  logError: (message, data) => console.error(message, data),
});

attachGlobalErrorHandlers(eventTracker);
exposeTrackerForDebugging(eventTracker);
