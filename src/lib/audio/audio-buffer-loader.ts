/**
 * Audio Buffer Loader Module
 *
 * Handles loading and caching of AudioBuffer objects.
 * Split from audio-loader.ts for better organization.
 *
 * @module audio/audio-buffer-loader
 */

import { getAudioUrl, resolveCandidates } from "./audio-registry";

/**
 * Audio Buffer Loader
 * Handles loading and caching of AudioBuffer objects
 */
export class AudioBufferLoader {
  private audioContext: AudioContext | null = null;
  private bufferCache = new Map<string, AudioBuffer>();
  private loadingCache = new Map<string, Promise<AudioBuffer | null>>();
  private fallbackEffects = new Map<string, AudioBuffer>();

  /**
   * Set the AudioContext and prepare fallback effects
   */
  setAudioContext(ctx: AudioContext): void {
    this.audioContext = ctx;
    this.prepareFallbackEffects();
  }

  /**
   * Prepare fallback effects (currently unused, kept for future extensibility)
   */
  private prepareFallbackEffects(): void {
    // Tone generation completely removed (Jan 2026).
    // All fallback mechanisms now rely on speech synthesis or audio files.
    this.fallbackEffects = new Map<string, AudioBuffer>();
  }

  /**
   * Load audio buffer from the index by key
   */
  async loadFromIndex(key: string): Promise<AudioBuffer | null> {
    if (!this.audioContext || !key) return null;

    // Check cache first
    const cached = this.bufferCache.get(key);
    if (cached) return cached;

    // Check if already loading
    const pending = this.loadingCache.get(key);
    if (pending) return pending;

    // Get URL from registry
    const url = await getAudioUrl(key);
    if (!url) {
      console.warn(`[AudioBufferLoader] No URL found for key: "${key}"`);
      return null;
    }

    // Create loading promise
    const loadPromise = (async () => {
      try {
        if (import.meta.env.DEV) {
          console.log(
            `[AudioBufferLoader] Loading audio: "${key}" from ${url}`,
          );
        }

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer =
          await this.audioContext!.decodeAudioData(arrayBuffer);

        // Cache the result
        this.bufferCache.set(key, audioBuffer);
        this.loadingCache.delete(key);

        if (import.meta.env.DEV) {
          console.log(`[AudioBufferLoader] Successfully loaded: "${key}"`);
        }

        return audioBuffer;
      } catch (error) {
        console.error(
          `[AudioBufferLoader] Failed to load audio "${key}" from ${url}:`,
          error,
        );
        this.loadingCache.delete(key);
        return null;
      }
    })();

    this.loadingCache.set(key, loadPromise);
    return loadPromise;
  }

  /**
   * Load audio buffer by name, trying multiple candidates
   */
  async loadBufferForName(
    name: string,
    allowFallback = true,
  ): Promise<AudioBuffer | null> {
    const candidates = resolveCandidates(name);

    // Try each candidate
    for (const candidate of candidates) {
      const buffer = await this.loadFromIndex(candidate);
      if (buffer) return buffer;
    }

    // Use fallback if allowed
    if (allowFallback) {
      // Try speech synthesis fallback before giving up
      if (import.meta.env.DEV) {
        console.warn(
          `[AudioBufferLoader] No audio file for "${name}", attempting speech synthesis fallback`,
        );
      }

      try {
        // Dynamically import speech synthesizer to avoid circular dependencies
        const { speechSynthesizer } = await import("./speech-synthesizer");

        // Clean up name for speech (remove underscores, emoji prefix)
        const cleanName = name
          .replace(/^emoji_/, "")
          .replace(/_/g, " ")
          .trim();

        // Attempt to speak the word (non-blocking)
        const spoken = await speechSynthesizer.speakAsync(cleanName, {
          rate: 1.0,
          pitch: 1.0,
          volume: 0.85,
        });

        if (spoken && import.meta.env.DEV) {
          console.log(
            `[AudioBufferLoader] Speech synthesis succeeded for "${name}"`,
          );
        }
      } catch (speechError) {
        if (import.meta.env.DEV) {
          console.warn(
            `[AudioBufferLoader] Speech synthesis also failed for "${name}":`,
            speechError,
          );
        }
      }

      // Check for tone/effect fallbacks
      const fallback =
        this.fallbackEffects.get(name) || this.fallbackEffects.get("success");
      if (fallback) {
        return fallback;
      }
    }

    return null;
  }

  /**
   * Get a fallback buffer by name
   */
  getFallbackBuffer(name: string): AudioBuffer | undefined {
    return this.fallbackEffects.get(name);
  }

  /**
   * Get the number of loaded buffers
   */
  getLoadedCount(): number {
    return this.bufferCache.size;
  }

  /**
   * Get the number of pending loads
   */
  getPendingCount(): number {
    return this.loadingCache.size;
  }

  /**
   * Get the number of fallback effects
   */
  getFallbackCount(): number {
    return this.fallbackEffects.size;
  }
}

// Export singleton instance
export const audioBufferLoader = new AudioBufferLoader();
