/**
 * Audio Preloader Module
 *
 * Handles progressive loading of audio assets by priority.
 * Extracted from sound-manager.ts for better organization.
 *
 * @module audio/audio-preloader
 */

import { audioBufferLoader } from "./audio-buffer-loader";
import { audioContextManager } from "./audio-context-manager";
import { AUDIO_PRIORITIES } from "./audio-priorities";
import { AudioPriority } from "./types";

/**
 * Audio Preloader
 * Manages progressive loading of audio assets
 */
export class AudioPreloader {
  private loadedPriorities = new Set<AudioPriority>();
  private preloadInProgress = false;
  private preloadConcurrency = 4;

  /**
   * Preload audio files for a specific priority level
   */
  async preloadAudioByPriority(priority: AudioPriority): Promise<void> {
    if (this.loadedPriorities.has(priority)) {
      if (import.meta.env.DEV) {
        console.log(
          `[AudioPreloader] Priority ${AudioPriority[priority]} already loaded`,
        );
      }
      return;
    }

    const audioKeys = AUDIO_PRIORITIES[priority];
    if (!audioKeys || audioKeys.length === 0) {
      return;
    }

    if (import.meta.env.DEV) {
      console.log(
        `[AudioPreloader] Loading ${audioKeys.length} audio files for priority ${AudioPriority[priority]}`,
      );
    }

    await this.prefetchAudioKeys(audioKeys);
    this.loadedPriorities.add(priority);

    if (import.meta.env.DEV) {
      console.log(
        `[AudioPreloader] Completed loading priority ${AudioPriority[priority]} (${audioKeys.length} files)`,
      );
    }
  }

  /**
   * Prefetch multiple audio keys in parallel with concurrency control
   */
  async prefetchAudioKeys(keys: string[]): Promise<void> {
    if (!audioContextManager.isInitialized()) {
      if (import.meta.env.DEV) {
        console.warn(
          "[AudioPreloader] Cannot prefetch - audio context not initialized",
        );
      }
      return;
    }

    const chunks: string[][] = [];
    for (let i = 0; i < keys.length; i += this.preloadConcurrency) {
      chunks.push(keys.slice(i, i + this.preloadConcurrency));
    }

    for (const chunk of chunks) {
      await Promise.all(
        chunk.map((key) => audioBufferLoader.loadFromIndex(key)),
      );
    }
  }

  /**
   * Start progressive loading of all priority levels
   */
  async startProgressiveLoading(): Promise<void> {
    if (this.preloadInProgress) {
      if (import.meta.env.DEV) {
        console.log("[AudioPreloader] Progressive loading already in progress");
      }
      return;
    }

    this.preloadInProgress = true;

    try {
      // Load COMMON priority files in the background
      if (!this.loadedPriorities.has(AudioPriority.COMMON)) {
        await this.preloadAudioByPriority(AudioPriority.COMMON);
      }

      // Then load RARE priority files
      if (!this.loadedPriorities.has(AudioPriority.RARE)) {
        await this.preloadAudioByPriority(AudioPriority.RARE);
      }

      if (import.meta.env.DEV) {
        console.log("[AudioPreloader] Progressive loading completed");
      }
    } catch (error) {
      console.error("[AudioPreloader] Progressive loading failed:", error);
    } finally {
      this.preloadInProgress = false;
    }
  }

  /**
   * Check if a priority level has been loaded
   */
  isPriorityLoaded(priority: AudioPriority): boolean {
    return this.loadedPriorities.has(priority);
  }

  /**
   * Get loaded priorities count
   */
  getLoadedPrioritiesCount(): number {
    return this.loadedPriorities.size;
  }

  /**
   * Set preload concurrency (number of parallel loads)
   */
  setConcurrency(concurrency: number): void {
    this.preloadConcurrency = Math.max(1, Math.min(10, concurrency));
  }
}

// Export singleton instance
export const audioPreloader = new AudioPreloader();
