/**
 * Emoji Tracker - Emoji lifecycle and rotation monitoring
 *
 * Split from event-tracker.ts (Jan 2026) for better code organization.
 * Handles:
 * - Emoji spawn → visible → tapped/missed lifecycle
 * - Rotation fairness (all emojis appear within threshold)
 * - Appearance frequency and audio correlation
 *
 * @module emoji-tracker
 */

export interface EmojiLifecycleEvent {
  objectId: string;
  emoji: string;
  name: string;
  phase: "spawned" | "rendered" | "visible" | "tapped" | "removed" | "missed";
  timestamp: number;
  position?: { x: number; y: number };
  playerSide?: "left" | "right";
  duration?: number; // Time since spawn
  data?: Record<string, unknown>;
}

export interface EmojiAppearanceStats {
  emoji: string;
  name: string;
  lastAppearance: number;
  appearanceCount: number;
  timeSinceLastAppearance: number;
  audioPlayed: boolean;
  audioKey?: string;
}

export class EmojiTracker {
  // Lifecycle tracking
  private emojiLifecycles: Map<string, EmojiLifecycleEvent[]> = new Map();
  private maxTrackedEmojis = 10; // Track first 10 emojis
  private trackedEmojiCount = 0;
  private isLifecycleTrackingEnabled = false;

  // Rotation tracking
  private emojiAppearances: Map<string, EmojiAppearanceStats> = new Map();
  private rotationThreshold = 10000; // 10 seconds

  /**
   * Enable/disable lifecycle tracking (performance-sensitive)
   */
  enableLifecycleTracking(enable: boolean = true) {
    this.isLifecycleTrackingEnabled = enable;
    if (enable) {
      this.trackedEmojiCount = 0;
      this.emojiLifecycles.clear();
      if (import.meta.env.DEV) {
        console.log(
          "[EmojiTracker] Lifecycle tracking enabled - will track first",
          this.maxTrackedEmojis,
          "emojis"
        );
      }
    }
  }

  /**
   * Track an emoji lifecycle event (spawn, visible, tap, etc.)
   */
  trackEmojiLifecycle(
    event: Omit<EmojiLifecycleEvent, "timestamp" | "duration">
  ) {
    if (!this.isLifecycleTrackingEnabled) return;

    const { objectId, emoji, name, phase, position, playerSide, data } = event;

    // Get or create lifecycle array for this object
    if (!this.emojiLifecycles.has(objectId)) {
      // Stop tracking if we've reached max
      if (this.trackedEmojiCount >= this.maxTrackedEmojis) {
        return;
      }
      this.emojiLifecycles.set(objectId, []);
      this.trackedEmojiCount++;
    }

    const lifecycleEvents = this.emojiLifecycles.get(objectId)!;
    const firstEvent = lifecycleEvents[0];
    const duration = firstEvent ? Date.now() - firstEvent.timestamp : 0;

    const lifecycleEvent: EmojiLifecycleEvent = {
      objectId,
      emoji,
      name,
      phase,
      timestamp: Date.now(),
      duration,
      position,
      playerSide,
      data,
    };

    lifecycleEvents.push(lifecycleEvent);

    if (import.meta.env.DEV) {
      console.log(
        `[EmojiTracker #${this.emojiLifecycles.size}/${
          this.maxTrackedEmojis
        }] ${phase.toUpperCase()}: ${emoji} ${name}`,
        `(${duration}ms)`,
        position
          ? `at (${position.x.toFixed(1)}, ${position.y.toFixed(1)})`
          : "",
        playerSide ? `[${playerSide}]` : "",
        data || ""
      );
    }

    return lifecycleEvent;
  }

  /**
   * Get lifecycle events for a specific emoji object
   */
  getEmojiLifecycle(objectId: string): EmojiLifecycleEvent[] | undefined {
    return this.emojiLifecycles.get(objectId);
  }

  /**
   * Get all tracked emoji lifecycles
   */
  getAllEmojiLifecycles(): Map<string, EmojiLifecycleEvent[]> {
    return new Map(this.emojiLifecycles);
  }

  /**
   * Get aggregated lifecycle statistics
   */
  getLifecycleStats() {
    const stats = {
      totalTracked: this.emojiLifecycles.size,
      maxTracked: this.maxTrackedEmojis,
      isEnabled: this.isLifecycleTrackingEnabled,
      emojis: [] as Array<{
        objectId: string;
        emoji: string;
        name: string;
        spawnTime: number;
        phases: string[];
        totalDuration: number;
        wasCompleted: boolean;
      }>,
    };

    this.emojiLifecycles.forEach((events, objectId) => {
      if (events.length === 0) return;

      const firstEvent = events[0];
      const lastEvent = events[events.length - 1];
      const phases = events.map((e) => e.phase);

      stats.emojis.push({
        objectId,
        emoji: firstEvent.emoji,
        name: firstEvent.name,
        spawnTime: firstEvent.timestamp,
        phases,
        totalDuration: lastEvent.timestamp - firstEvent.timestamp,
        wasCompleted: phases.includes("tapped") || phases.includes("removed"),
      });
    });

    return stats;
  }

  /**
   * Clear lifecycle tracking data
   */
  clearLifecycleTracking() {
    this.emojiLifecycles.clear();
    this.trackedEmojiCount = 0;
    if (import.meta.env.DEV) {
      console.log("[EmojiTracker] Lifecycle tracking cleared");
    }
  }

  /**
   * Initialize rotation tracking for a level's emoji set
   */
  initializeEmojiTracking(levelItems: Array<{ emoji: string; name: string }>) {
    this.emojiAppearances.clear();

    levelItems.forEach((item) => {
      this.emojiAppearances.set(item.emoji, {
        emoji: item.emoji,
        name: item.name,
        lastAppearance: 0,
        appearanceCount: 0,
        timeSinceLastAppearance: 0,
        audioPlayed: false,
      });
    });

    if (import.meta.env.DEV) {
      console.log(
        `[EmojiRotation] Initialized tracking for ${levelItems.length} emojis`
      );
    }
  }

  /**
   * Track an emoji appearance (spawn or target change)
   */
  trackEmojiAppearance(emoji: string, audioKey?: string) {
    const stats = this.emojiAppearances.get(emoji);
    if (!stats) {
      console.warn(
        `[EmojiRotation] Tracking appearance of unknown emoji: ${emoji}`
      );
      return;
    }

    const now = Date.now();
    stats.lastAppearance = now;
    stats.appearanceCount++;
    stats.audioPlayed = !!audioKey;
    stats.audioKey = audioKey;
    stats.timeSinceLastAppearance = 0;

    if (import.meta.env.DEV) {
      console.log(
        `[EmojiRotation] ${emoji} appeared (count: ${
          stats.appearanceCount
        }, audio: ${audioKey || "none"})`
      );
    }
  }

  /**
   * Get rotation statistics (sorted by wait time)
   */
  getEmojiRotationStats(): EmojiAppearanceStats[] {
    const now = Date.now();
    const stats: EmojiAppearanceStats[] = [];

    this.emojiAppearances.forEach((stat) => {
      const timeSince =
        stat.lastAppearance > 0 ? now - stat.lastAppearance : now;

      stats.push({
        ...stat,
        timeSinceLastAppearance: timeSince,
      });
    });

    // Sort by time since last appearance (longest wait first)
    return stats.sort(
      (a, b) => b.timeSinceLastAppearance - a.timeSinceLastAppearance
    );
  }

  /**
   * Get emojis that haven't appeared within threshold
   */
  getOverdueEmojis(): EmojiAppearanceStats[] {
    const stats = this.getEmojiRotationStats();
    return stats.filter(
      (stat) => stat.timeSinceLastAppearance > this.rotationThreshold
    );
  }

  /**
   * Check rotation health (all emojis appearing frequently enough)
   */
  checkRotationHealth(): {
    healthy: boolean;
    overdueCount: number;
    maxWaitTime: number;
  } {
    const allStats = this.getEmojiRotationStats();
    const overdue = allStats.filter(
      (stat) => stat.timeSinceLastAppearance > this.rotationThreshold
    );
    const maxWaitTime =
      allStats.length > 0 ? allStats[0].timeSinceLastAppearance : 0;

    const healthy = overdue.length === 0;

    if (!healthy && import.meta.env.DEV) {
      console.warn(
        `[EmojiRotation] ⚠️ ${overdue.length} emojis overdue (>${this.rotationThreshold}ms):`,
        overdue.map(
          (e) =>
            `${e.emoji} ${e.name} (${(e.timeSinceLastAppearance / 1000).toFixed(
              1
            )}s)`
        )
      );
    }

    return { healthy, overdueCount: overdue.length, maxWaitTime };
  }

  /**
   * Clear rotation tracking data
   */
  clearEmojiRotationTracking() {
    this.emojiAppearances.clear();
  }
}

// Export singleton instance
export const emojiTracker = new EmojiTracker();
