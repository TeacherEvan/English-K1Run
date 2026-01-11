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
} from "./event-tracking";

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
   * Start performance monitoring - call when gameplay starts
   * Uses requestAnimationFrame to measure frame rate
   */
  startPerformanceMonitoring() {
    if (this.isPerformanceMonitoringActive) return;
    this.isPerformanceMonitoringActive = true;

    let frameCount = 0;
    let lastTime = performance.now();

    const measureFrameRate = () => {
      if (!this.isPerformanceMonitoringActive) return; // Stop if disabled

      frameCount++;
      const currentTime = performance.now();

      if (currentTime - lastTime >= 1000) {
        this.performanceMetrics.frameRate = frameCount;
        frameCount = 0;
        lastTime = currentTime;

        // Track low frame rate as warning (only in dev to reduce overhead)
        if (import.meta.env.DEV && this.performanceMetrics.frameRate < 30) {
          this.trackEvent({
            type: "warning",
            category: "performance",
            message: "Low frame rate detected",
            data: { frameRate: this.delegated to performanceTracker
   * @deprecated Use performanceTracker.startPerformanceMonitoring() directly
   */
  startPerformanceMonitoring() {
    const { performanceTracker } = require("./event-tracking");
    performanceTracker.startPerformanceMonitoring();
  }

  /**
   * Stop performance monitoring - delegated to performanceTracker
   * @deprecated Use performanceTracker.stopPerformanceMonitoring() directly
   */
  stopPerformanceMonitoring() {
    const { performanceTracker } = require("./event-tracking");
    performanceTracker.stopPerformanceMonitoring()event.category}: ${event.message}`,
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
    const { performanceTracker } = require("./event-tracking");

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
    const { performanceTracker } = require("./event-tracking");

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
  } {
    const { performanceTracker } = require("./event-tracking");
    return performanceTracker.getPerformanceMetrics();
  }

  // Reset performance metrics - delegated
  resetPerformanceMetrics() {
    const { performanceTracker } = require("./event-tracking");
    performanceTracker.resetPerformanceMetrics()
    this.performanceMetrics.objectSpawnRate = 0;
    this.performanceMetrics.touchLatency = 0;
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
    const { emojiTracker } = require("./event-tracking");
    emojiTracker.enableLifecycleTracking(enable);
  }

  trackEmojiLifecycle(
    event: Omit<import("./event-tracking").EmojiLifecycleEvent, "timestamp" | "duration">
  ) {
    const { emojiTracker } = require("./event-tracking");
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
    const { emojiTracker } = require("./event-tracking");
    return emojiTracker.getEmojiLifecycle(objectId);
  }

  getAllEmojiLifecycles() {
    const { emojiTracker } = require("./event-tracking");
    return emojiTracker.getAllEmojiLifecycles();
  }

  getLifecycleStats() {
    const { emojiTracker } = require("./event-tracking");
    return emojiTracker.getLifecycleStats();
  }

  clearLifecycleTracking() {
    const { emojiTracker } = require("./event-tracking");
    emojiTracker.clearLifecycleTracking();
  }

  // Audio playback tracking methods - delegated to audioEventTracker
  trackAudioPlayback(event: Omit<import("./event-tracking").AudioPlaybackEvent, "id" | "timestamp">) {
    const { audioEventTracker } = require("./event-tracking");
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
    const { audioEventTracker } = require("./event-tracking");
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
    const { audioEventTracker } = require("./event-tracking");
    return audioEventTracker.getAudioPlaybackStats();
  }

  // Emoji appearance tracking for rotation monitoring - delegated to emojiTracker
  initializeEmojiTracking(levelItems: Array<{ emoji: string; name: string }>) {
    const { emojiTracker } = require("./event-tracking");
    emojiTracker.initializeEmojiTracking(levelItems);
  }

  trackEmojiAppearance(emoji: string, audioKey?: string) {
    const { emojiTracker } = require("./event-tracking");
    emojiTracker.trackEmojiAppearance(emoji, audioKey);
  }

  getEmojiRotationStats() {
    const { emojiTracker } = require("./event-tracking");
    return emojiTracker.getEmojiRotationStats();
  }

  getOverdueEmojis() {
    const { emojiTracker } = require("./event-tracking");
    return emojiTracker.getOverdueEmojis();
  }

  checkRotationHealth() {
    const { emojiTracker } = require("./event-tracking");
    return emojiTracker.checkRotationHealth();
  }

  clearAudioTracking() {
    const { audioEventTracker } = require("./event-tracking");
    audioEventTracker.clearAudioTracking();
  }

  clearEmojiRotationTracking() {
    const { emojiTracker } = require("./event-tracking");
    emojiTracker.clearEmojiRotationTracking();
  }
}

// Create singleton instance
export const eventTracker = new EventTracker();

// Expose to global for debugging
if (typeof window !== "undefined") {
  (window as Window & { gameEventTracker?: EventTracker }).gameEventTracker =
    eventTracker;
}
