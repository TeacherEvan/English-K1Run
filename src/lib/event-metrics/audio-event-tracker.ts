/**
 * Audio Event Tracker - Audio playback monitoring and statistics
 *
 * Split from event-tracker.ts (Jan 2026) for better code organization.
 * Handles all audio-related tracking including:
 * - Playback success/failure logging
 * - Method distribution (web-audio, html-audio, speech, sprite, etc.)
 * - Audio key correlation with game targets
 *
 * @module audio-event-tracker
 */

import { generateUniqueIdentifier } from "../semantic-utils";

export interface AudioPlaybackEvent {
  id: string;
  timestamp: number;
  audioKey: string;
  targetName: string;
  method:
    | "wav"
    | "html-audio"
    | "speech-synthesis"
    | "web-audio"
    | "audio-sprite";
  success: boolean;
  duration?: number;
  error?: string;
}

export class AudioEventTracker {
  private audioPlaybackEvents: AudioPlaybackEvent[] = [];
  private maxAudioEvents = 100;

  /**
   * Track an audio playback attempt with method and result
   */
  trackAudioPlayback(event: Omit<AudioPlaybackEvent, "id" | "timestamp">) {
    const audioEvent: AudioPlaybackEvent = {
      id: generateUniqueIdentifier("audio"),
      timestamp: Date.now(),
      ...event,
    };

    this.audioPlaybackEvents.push(audioEvent);

    // Keep only recent events
    if (this.audioPlaybackEvents.length > this.maxAudioEvents) {
      this.audioPlaybackEvents = this.audioPlaybackEvents.slice(
        -this.maxAudioEvents,
      );
    }

    if (import.meta.env.DEV) {
      console.log(
        `[AudioTracker] ${event.success ? "✓" : "✗"} ${event.method}:`,
        event.audioKey,
        event.error || "",
      );
    }

    return audioEvent;
  }

  /**
   * Get recent audio playback history
   */
  getAudioPlaybackHistory(limit = 20): AudioPlaybackEvent[] {
    return this.audioPlaybackEvents.slice(-limit).reverse();
  }

  /**
   * Get aggregated audio playback statistics
   */
  getAudioPlaybackStats() {
    const stats = {
      totalAttempts: this.audioPlaybackEvents.length,
      successful: this.audioPlaybackEvents.filter((e) => e.success).length,
      failed: this.audioPlaybackEvents.filter((e) => !e.success).length,
      byMethod: {} as Record<string, { success: number; failed: number }>,
    };

    this.audioPlaybackEvents.forEach((event) => {
      if (!stats.byMethod[event.method]) {
        stats.byMethod[event.method] = { success: 0, failed: 0 };
      }
      if (event.success) {
        stats.byMethod[event.method].success++;
      } else {
        stats.byMethod[event.method].failed++;
      }
    });

    return stats;
  }

  /**
   * Clear all audio tracking data
   */
  clearAudioTracking() {
    this.audioPlaybackEvents = [];
  }
}

// Export singleton instance
export const audioEventTracker = new AudioEventTracker();
