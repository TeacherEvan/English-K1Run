import { performanceTracker } from "../event-metrics/performance-tracker";
import { createAudioDelegates } from "./delegates/audio";
import { createEmojiDelegates } from "./delegates/emoji";
import type { GameEvent } from "./types";

interface TrackerEnv {
  isDev: boolean;
  generateId: () => string;
  now: () => number;
  userAgent: () => string | undefined;
  url: () => string | undefined;
  logError: (message: string, data?: unknown) => void;
}

const safe = <T>(fn: () => T, fallback: T): T => {
  try {
    return fn();
  } catch {
    return fallback;
  }
};

/**
 * Main event tracker facade.
 *
 * Design intent: gameplay mechanics may call this, but it must never throw.
 */
export class EventTracker {
  private events: GameEvent[] = [];
  private maxEvents = 500;

  private readonly audio = createAudioDelegates((e) => this.trackEvent(e));
  private readonly emoji = createEmojiDelegates((e) => this.trackEvent(e));

  public readonly enableLifecycleTracking = this.emoji.enableLifecycleTracking;
  public readonly trackEmojiLifecycle = this.emoji.trackEmojiLifecycle;
  public readonly getEmojiLifecycle = this.emoji.getEmojiLifecycle;
  public readonly getAllEmojiLifecycles = this.emoji.getAllEmojiLifecycles;
  public readonly getLifecycleStats = this.emoji.getLifecycleStats;
  public readonly clearLifecycleTracking = this.emoji.clearLifecycleTracking;
  public readonly initializeEmojiTracking = this.emoji.initializeEmojiTracking;
  public readonly trackEmojiAppearance = this.emoji.trackEmojiAppearance;
  public readonly getEmojiRotationStats = this.emoji.getEmojiRotationStats;
  public readonly getOverdueEmojis = this.emoji.getOverdueEmojis;
  public readonly checkRotationHealth = this.emoji.checkRotationHealth;
  public readonly clearEmojiRotationTracking =
    this.emoji.clearEmojiRotationTracking;

  public readonly trackAudioPlayback = this.audio.trackAudioPlayback;
  public readonly getAudioPlaybackHistory = this.audio.getAudioPlaybackHistory;
  public readonly getAudioPlaybackStats = this.audio.getAudioPlaybackStats;
  public readonly clearAudioTracking = this.audio.clearAudioTracking;

  public constructor(private readonly env: TrackerEnv) {}

  public trackEvent(
    event: Omit<GameEvent, "id" | "timestamp" | "userAgent" | "url">,
  ) {
    try {
      const fullEvent: GameEvent = {
        ...event,
        id: this.env.generateId(),
        timestamp: this.env.now(),
        userAgent: safe(this.env.userAgent, undefined),
        url: safe(this.env.url, undefined),
      };

      this.events.push(fullEvent);
      if (this.events.length > this.maxEvents) {
        this.events = this.events.slice(-this.maxEvents);
      }

      if (this.env.isDev && event.type === "error") {
        this.env.logError(
          `[EventTracker] ${event.category}: ${event.message}`,
          event.data,
        );
      }
    } catch {
      // telemetry must never crash gameplay
    }
  }

  public startPerformanceMonitoring() {
    performanceTracker.startPerformanceMonitoring();
  }
  public stopPerformanceMonitoring() {
    performanceTracker.stopPerformanceMonitoring();
  }
  public getPerformanceMetrics() {
    return performanceTracker.getPerformanceMetrics();
  }
  public resetPerformanceMetrics() {
    performanceTracker.resetPerformanceMetrics();
  }

  public trackTestEvent(name: string, data?: Record<string, unknown>) {
    this.trackEvent({ type: "test", category: "e2e", message: name, data });
  }

  public trackObjectSpawn(
    objectType: string,
    position?: { x?: number; y?: number; count?: number },
  ) {
    this.trackEvent({
      type: "info",
      category: "game_object",
      message: position?.count ? "Objects batch spawned" : "Object spawned",
      data: position?.count
        ? { batchSize: position.count, objectType }
        : { objectType, position },
    });
    performanceTracker.trackObjectSpawn();
  }

  public trackObjectTap(
    objectId: string,
    correct: boolean,
    playerSide: "left" | "right",
    latency: number,
  ) {
    this.trackEvent({
      type: "user_action",
      category: "game_interaction",
      message: correct ? "Correct tap" : "Incorrect tap",
      data: { objectId, correct, playerSide, latency },
    });
    performanceTracker.trackTouchLatency(latency);
  }

  public trackGameStateChange(
    oldState: Record<string, unknown>,
    newState: Record<string, unknown>,
    action: string,
  ) {
    this.trackEvent({
      type: "info",
      category: "game_state",
      message: `Game state changed: ${action}`,
      data: { oldState, newState, action },
    });
  }

  public trackError(error: Error, context: string) {
    this.trackEvent({
      type: "error",
      category: "game_logic",
      message: error.message,
      data: { context },
      stackTrace: error.stack,
    });
  }

  public trackWarning(message: string, data?: Record<string, unknown>) {
    this.trackEvent({ type: "warning", category: "game_logic", message, data });
  }

  public getEvents(
    type?: GameEvent["type"],
    category?: string,
    limit?: number,
  ) {
    let filtered = this.events;
    if (type) filtered = filtered.filter((e) => e.type === type);
    if (category) filtered = filtered.filter((e) => e.category === category);
    if (limit) filtered = filtered.slice(-limit);
    return filtered.slice().sort((a, b) => b.timestamp - a.timestamp);
  }

  public getRecentEvents(limit: number = 10) {
    return this.events.slice(-limit).sort((a, b) => b.timestamp - a.timestamp);
  }

  public exportEvents() {
    return JSON.stringify(this.events, null, 2);
  }
  public clearEvents() {
    this.events = [];
  }

  public trackLanguageChange(language: string, previousLanguage?: string) {
    this.trackEvent({
      type: "language_change",
      category: "user_settings",
      message: `Language changed to ${language}`,
      data: { language, previousLanguage, timestamp: this.env.now() },
    });
  }
}
