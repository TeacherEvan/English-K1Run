/**
 * Event Tracking System - Barrel Export
 *
 * Centralized exports for all event tracking subsystems.
 *
 * @module event-tracking
 */

// Audio tracking
export {
  AudioEventTracker,
  audioEventTracker,
  type AudioPlaybackEvent,
} from "./audio-event-tracker";

// Emoji tracking
export {
  EmojiTracker,
  emojiTracker,
  type EmojiAppearanceStats,
  type EmojiLifecycleEvent,
} from "./emoji-tracker";

// Performance tracking
export {
  PerformanceTracker,
  performanceTracker,
  type PerformanceMetrics,
} from "./performance-tracker";
