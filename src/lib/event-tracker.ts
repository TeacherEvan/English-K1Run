/**
 * Event tracking system for monitoring game errors and lifecycle
 *
 * Refactored Jan 2026: Split into focused modules for better maintainability.
 * - Audio tracking → src/lib/event-tracking/audio-event-tracker.ts
 * - Emoji tracking → src/lib/event-tracking/emoji-tracker.ts
 * - Performance → src/lib/event-tracking/performance-tracker.ts
 * 
 * This file remains as the main facade for general event logging.
 */

import { audioEventTracker } from "./event-tracking/audio-event-tracker";
import { emojiTracker } from "./event-tracking/emoji-tracker";
import { performanceTracker } from "./event-tracking/performance-tracker";

// Re-export subsystem types and singletons for backward compatibility
export type {
  AudioPlaybackEvent,
  EmojiLifecycleEvent,
  EmojiAppearanceStats,
  PerformanceMetrics,
} from "./event-tracking";

export {
  audioEventTracker,
  emojiTracker,
  performanceTracker,
};

export interface GameEvent {
  id: string;
  timestamp: number;
  type:
    | "error"
    | "warning"
    | "info"
    | "performance"
    | "user_action"
    | "lifecycle"
    | "test"
    | "language_change";
  category: string;
  message: string;
  data?: Record<string, unknown>;
  stackTrace?: string;
  userAgent?: string;
  url?: string;
}

/**
 * Main event tracker for general application events, errors, and lifecycle tracking.
 * Delegates specialized tracking to focused subsystems.
 */
class EventTracker {
  private events: GameEvent[] = [];
  private maxEvents = 500;

  constructor() {
    // Set up global error handlers
    this.setupErrorHandlers();
  }

  private setupErrorHandlers() {
    // Catch JavaScript errors
    window.addEventListener("error", (event) => {
      this.trackEvent({
        type: "error",
        category: "javascript",
        message: event.message,
        data: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
        stackTrace: event.error?.stack,
      });
    });

    // Catch unhandled promise rejections
    window.addEventListener("unhandledrejection", (event) => {
      this.trackEvent({
        type: "error",
        category: "promise",
        message: "Unhandled promise rejection",
        data: {
          reason: event.reason,
        },
        stackTrace: event.reason?.stack,
      });
    });
  }

  /**
   * Start performance monitoring - delegated to performanceTracker
   * @deprecated Use performanceTracker.startPerformanceMonitoring() directly
   */
  startPerformanceMonitoring() {
    performanceTracker.startPerformanceMonitoring();
  }

  /**
   * Stop performance monitoring - delegated to performanceTracker
   * @deprecated Use performanceTracker.stopPerformanceMonitoring() directly
   */
  stopPerformanceMonitoring() {
    performanceTracker.stopPerformanceMonitoring();
  }

  /**
   * Track an event with automatic timestamping and ID generation
   */
  private trackEvent(
    event: Omit<GameEvent, "id" | "timestamp" | "userAgent" | "url">
  ) {
    const fullEvent: GameEvent = {
      ...event,
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    this.events.push(fullEvent);

    // Keep events under max limit
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Log in dev mode
    if (import.meta.env.DEV && event.type === "error") {
      console.error(
        `[EventTracker] ${event.category}: ${event.message}`,
        event.data
      );
    }
  }

  /**
   * Track a test-specific event for E2E testing verification
   */
  trackTestEvent(name: string, data?: Record<string, unknown>) {
    this.trackEvent({
      type: "test",
      category: "e2e",
      message: name,
      data,
    });
  }

  // Game-specific tracking methods with optimized performance
  trackObjectSpawn(
    objectType: string,
    position?: { x?: number; y?: number; count?: number }
  ) {
    // Batch track spawns to reduce overhead
    if (position?.count) {
      this.trackEvent({
        type: "info",
        category: "game_object",
        message: "Objects batch spawned",
        data: { batchSize: position.count, objectType },
      });
    } else {
      this.trackEvent({
        type: "info",
        category: "game_object",
        message: "Object spawned",
        data: { objectType, position },
      });
    }

    performanceTracker.trackObjectSpawn();
  }

  trackObjectTap(
    objectId: string,
    correct: boolean,
    playerSide: "left" | "right",
    latency: number
  ) {
    this.trackEvent({
      type: "user_action",
      category: "game_interaction",
      message: correct ? "Correct tap" : "Incorrect tap",
      data: { objectId, correct, playerSide, latency },
    });

    performanceTracker.trackTouchLatency(latency);
  }

  trackGameStateChange(
    oldState: Record<string, unknown>,
    newState: Record<string, unknown>,
    action: string
  ) {
    this.trackEvent({
      type: "info",
      category: "game_state",
      message: `Game state changed: ${action}`,
      data: { oldState, newState, action },
    });
  }

  trackError(error: Error, context: string) {
    this.trackEvent({
      type: "error",
      category: "game_logic",
      message: error.message,
      data: { context },
      stackTrace: error.stack,
    });
  }

  trackWarning(message: string, data?: Record<string, unknown>) {
    this.trackEvent({
      type: "warning",
      category: "game_logic",
      message,
      data,
    });
  }

  // Get events for debugging
  getEvents(
    type?: GameEvent["type"],
    category?: string,
    limit?: number
  ): GameEvent[] {
    let filtered = this.events;

    if (type) {
      filtered = filtered.filter((event) => event.type === type);
    }

    if (category) {
      filtered = filtered.filter((event) => event.category === category);
    }

    if (limit) {
      filtered = filtered.slice(-limit);
    }

    return filtered.sort((a, b) => b.timestamp - a.timestamp);
  }

  // Get recent events (for diagnostics)
  getRecentEvents(limit: number = 10): GameEvent[] {
    return this.events.slice(-limit).sort((a, b) => b.timestamp - a.timestamp);
  }

  // Get performance metrics - delegated to performanceTracker
  getPerformanceMetrics() {
    return performanceTracker.getPerformanceMetrics();
  }

  // Reset performance metrics - delegated
  resetPerformanceMetrics() {
    performanceTracker.resetPerformanceMetrics();
  }

  // Export events for debugging
  exportEvents(): string {
    return JSON.stringify(this.events, null, 2);
  }

  // Clear events
  clearEvents() {
    this.events = [];
  }

  // Emoji lifecycle tracking methods - delegated to emojiTracker
  enableLifecycleTracking(enable: boolean = true) {
    emojiTracker.enableLifecycleTracking(enable);
  }

  trackEmojiLifecycle(
    event: Omit<import("./event-tracking").EmojiLifecycleEvent, "timestamp" | "duration">
  ) {
    const lifecycleEvent = emojiTracker.trackEmojiLifecycle(event);

    // Also log to general event tracker
    if (lifecycleEvent) {
      this.trackEvent({
        type: "lifecycle",
        category: "emoji_lifecycle",
        message: `Emoji ${event.phase}: ${event.emoji} ${event.name}`,
        data: lifecycleEvent as unknown as Record<string, unknown>,
      });
    }
  }

  getEmojiLifecycle(objectId: string) {
    return emojiTracker.getEmojiLifecycle(objectId);
  }

  getAllEmojiLifecycles() {
    return emojiTracker.getAllEmojiLifecycles();
  }

  getLifecycleStats() {
    return emojiTracker.getLifecycleStats();
  }

  clearLifecycleTracking() {
    emojiTracker.clearLifecycleTracking();
  }

  // Audio playback tracking methods - delegated to audioEventTracker
  trackAudioPlayback(event: Omit<import("./event-tracking").AudioPlaybackEvent, "id" | "timestamp">) {
    const audioEvent = audioEventTracker.trackAudioPlayback(event);

    // Also track in general event system
    this.trackEvent({
      type: event.success ? "info" : "warning",
      category: "audio_playback",
      message: `Audio ${event.success ? "played" : "failed"}: ${
        event.audioKey
      }`,
      data: audioEvent as unknown as Record<string, unknown>,
    });
  }

  getAudioPlaybackHistory(limit = 20) {
    return audioEventTracker.getAudioPlaybackHistory(limit);
  }

  // Language selection tracking
  trackLanguageChange(language: string, previousLanguage?: string) {
    this.trackEvent({
      type: "language_change",
      category: "user_settings",
      message: `Language changed to ${language}`,
      data: {
        language,
        previousLanguage,
        timestamp: Date.now(),
      },
    });

    if (import.meta.env.DEV) {
      console.log(
        `[EventTracker] Language changed: ${
          previousLanguage || "unknown"
        } → ${language}`
      );
    }
  }

  getAudioPlaybackStats() {
    return audioEventTracker.getAudioPlaybackStats();
  }

  // Emoji appearance tracking for rotation monitoring - delegated to emojiTracker
  initializeEmojiTracking(levelItems: Array<{ emoji: string; name: string }>) {
    emojiTracker.initializeEmojiTracking(levelItems);
  }

  trackEmojiAppearance(emoji: string, audioKey?: string) {
    emojiTracker.trackEmojiAppearance(emoji, audioKey);
  }

  getEmojiRotationStats() {
    return emojiTracker.getEmojiRotationStats();
  }

  getOverdueEmojis() {
    return emojiTracker.getOverdueEmojis();
  }

  checkRotationHealth() {
    return emojiTracker.checkRotationHealth();
  }

  clearAudioTracking() {
    audioEventTracker.clearAudioTracking();
  }

  clearEmojiRotationTracking() {
    emojiTracker.clearEmojiRotationTracking();
  }
}

// Create singleton instance and export for use throughout the application
export const eventTracker = new EventTracker();

// Force TypeScript to recognize the export
export type { EventTracker };

// Expose to global for debugging
if (typeof window !== "undefined") {
  (window as Window & { gameEventTracker?: EventTracker }).gameEventTracker =
    eventTracker;
}
