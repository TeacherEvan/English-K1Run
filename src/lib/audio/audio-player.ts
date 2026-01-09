/**
 * Audio Player Module
 *
 * Handles audio playback using Web Audio API and HTMLAudio fallback.
 * Split from sound-manager.ts (Jan 2026) for better code organization.
 *
 * Responsibilities:
 * - Web Audio API playback
 * - HTML Audio fallback
 * - Active source management
 * - Volume control
 *
 * @module audio/audio-player
 */

import { eventTracker } from "../event-tracker";
import {
  audioBufferLoader,
  getAudioUrl,
  resolveCandidates,
} from "./audio-loader";

/**
 * Audio Player class
 * Manages audio playback through multiple methods
 */
export class AudioPlayer {
  private audioContext: AudioContext | null = null;
  private activeSources = new Map<string, AudioBufferSourceNode>();
  private activeHtmlAudio = new Map<string, HTMLAudioElement>();
  private volume = 0.6;
  private isEnabled = true;
  private isMobile = false;
  private preferHTMLAudio = false;

  constructor() {
    this.detectMobile();
  }

  private detectMobile(): void {
    if (typeof navigator === "undefined") return;

    const ua = navigator.userAgent.toLowerCase();
    this.isMobile =
      /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua);

    // ALWAYS use Web Audio API for better quality and correct playback speed
    // HTMLAudio can cause pitch/speed issues
    this.preferHTMLAudio = false;

    if (this.isMobile && import.meta.env.DEV) {
      console.log(
        "[AudioPlayer] Mobile device detected - using Web Audio API for correct playback"
      );
    }
  }

  setAudioContext(ctx: AudioContext): void {
    this.audioContext = ctx;
    audioBufferLoader.setAudioContext(ctx);
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  isInitialized(): boolean {
    return this.audioContext !== null;
  }

  /**
   * Play audio buffer through Web Audio API
   */
  startBuffer(
    buffer: AudioBuffer,
    delay = 0,
    key?: string,
    playbackRate = 1.0,
    volumeOverride?: number
  ): AudioBufferSourceNode | null {
    if (!this.audioContext || !this.isEnabled) return null;

    try {
      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;
      source.playbackRate.value = playbackRate;

      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = volumeOverride ?? this.volume;

      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      source.start(this.audioContext.currentTime + delay);

      if (key) {
        // Stop any previous instance
        const existing = this.activeSources.get(key);
        if (existing) {
          try {
            existing.stop();
          } catch {
            // Already stopped
          }
        }
        this.activeSources.set(key, source);

        source.onended = () => {
          this.activeSources.delete(key);
        };
      }

      return source;
    } catch (error) {
      console.error("[AudioPlayer] Failed to start buffer:", error);
      return null;
    }
  }

  /**
   * Play audio using HTML Audio element (fallback)
   */
  async playWithHtmlAudio(
    key: string,
    playbackRate = 1.0,
    maxDuration?: number,
    volumeOverride?: number
  ): Promise<boolean> {
    const url = await getAudioUrl(key);
    if (!url) return false;

    // Stop any previous instance of this sound
    if (this.activeHtmlAudio.has(key)) {
      try {
        const prevAudio = this.activeHtmlAudio.get(key)!;
        prevAudio.pause();
        prevAudio.currentTime = 0;
        this.activeHtmlAudio.delete(key);
      } catch {
        // Ignore errors
      }
    }

    return new Promise<boolean>((resolve) => {
      const audio = new Audio(url);
      audio.preload = "auto";
      audio.crossOrigin = "anonymous";
      audio.volume = volumeOverride ?? this.volume;
      audio.playbackRate = playbackRate;

      this.activeHtmlAudio.set(key, audio);

      let maxDurationTimer: number | undefined;

      const cleanup = () => {
        audio.removeEventListener("ended", handleEnded);
        audio.removeEventListener("error", handleError);
        if (maxDurationTimer !== undefined) {
          window.clearTimeout(maxDurationTimer);
        }
        this.activeHtmlAudio.delete(key);
      };

      const forceStop = () => {
        if (audio && !audio.paused) {
          audio.pause();
          audio.currentTime = 0;
        }
        cleanup();
        if (import.meta.env.DEV) {
          console.log(
            `[AudioPlayer] Force-stopped "${key}" after ${maxDuration}ms`
          );
        }
        resolve(true);
      };

      const handleEnded = () => {
        cleanup();
        eventTracker.trackAudioPlayback({
          audioKey: key,
          targetName: key,
          method: "html-audio",
          success: true,
          duration: audio.duration,
        });
        resolve(true);
      };

      const handleError = (event: Event) => {
        console.warn(`HTMLAudio playback failed for "${key}"`, event);
        cleanup();
        eventTracker.trackAudioPlayback({
          audioKey: key,
          targetName: key,
          method: "html-audio",
          success: false,
          error: "playback_error",
        });
        resolve(false);
      };

      audio.addEventListener("ended", handleEnded, { once: true });
      audio.addEventListener("error", handleError, { once: true });

      if (maxDuration !== undefined && maxDuration > 0) {
        maxDurationTimer = window.setTimeout(forceStop, maxDuration);
      }

      audio.play().catch((error) => {
        console.warn(`Unable to start audio element for "${key}":`, error);
        cleanup();
        eventTracker.trackAudioPlayback({
          audioKey: key,
          targetName: key,
          method: "html-audio",
          success: false,
          error: error.message || "play_error",
        });
        resolve(false);
      });
    });
  }

  /**
   * Play a voice clip by name
   */
  async playVoiceClip(
    name: string,
    playbackRate = 1.0,
    maxDuration?: number,
    volumeOverride?: number
  ): Promise<boolean> {
    const candidates = resolveCandidates(name);

    for (const candidate of candidates) {
      const played = await this.playWithHtmlAudio(
        candidate,
        playbackRate,
        maxDuration,
        volumeOverride
      );
      if (played) return true;
    }

    return false;
  }

  /**
   * Play a sound effect by name
   */
  async playSound(name: string, volumeOverride?: number): Promise<boolean> {
    if (!this.isEnabled) return false;

    try {
      const buffer = await audioBufferLoader.loadBufferForName(name, true);
      if (buffer) {
        const source = this.startBuffer(buffer, 0, name, 1.0, volumeOverride);
        return source !== null;
      }
      return false;
    } catch (error) {
      console.error(`[AudioPlayer] Failed to play sound "${name}":`, error);
      return false;
    }
  }

  /**
   * Stop all active audio
   */
  stopAll(): void {
    // Stop Web Audio sources
    for (const [key, source] of this.activeSources) {
      try {
        source.stop();
      } catch {
        // Already stopped
      }
      this.activeSources.delete(key);
    }

    // Stop HTML Audio elements
    for (const [key, audio] of this.activeHtmlAudio) {
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch {
        // Ignore
      }
      this.activeHtmlAudio.delete(key);
    }
  }

  /**
   * Get active source count
   */
  getActiveSourceCount(): number {
    return this.activeSources.size + this.activeHtmlAudio.size;
  }

  /**
   * Get player state
   */
  getState() {
    return {
      isEnabled: this.isEnabled,
      isMobile: this.isMobile,
      preferHTMLAudio: this.preferHTMLAudio,
      volume: this.volume,
      activeSources: this.activeSources.size,
      activeHtmlAudio: this.activeHtmlAudio.size,
    };
  }
}

// Export singleton instance
export const audioPlayer = new AudioPlayer();
