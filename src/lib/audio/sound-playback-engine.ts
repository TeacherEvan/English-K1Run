/**
 * Sound Playback Engine
 *
 * Handles Web Audio and HTMLAudio playback with tracking.
 * Extracted from sound-manager.ts for size and clarity.
 *
 * @module audio/sound-playback-engine
 */

import { eventTracker } from "../event-tracker";

export interface PlaybackContext {
  getAudioContext: () => AudioContext | null;
  getVolume: () => number;
}

export class SoundPlaybackEngine {
  private htmlAudioCache = new Map<string, string>();
  private activeSources = new Map<string, AudioBufferSourceNode>();
  private activeHtmlAudio = new Map<string, HTMLAudioElement>();

  constructor(private readonly context: PlaybackContext) {}

  startBuffer(
    buffer: AudioBuffer,
    delaySeconds = 0,
    soundKey?: string,
    playbackRate = 1.0,
    volumeOverride?: number,
  ) {
    const audioContext = this.context.getAudioContext();
    if (!audioContext) return;

    if (soundKey && this.activeSources.has(soundKey)) {
      try {
        const prevSource = this.activeSources.get(soundKey)!;
        prevSource.stop();
        this.activeSources.delete(soundKey);
      } catch {
        // Ignore errors from stopping already-stopped sources
      }
    }

    const source = audioContext.createBufferSource();
    const gainNode = audioContext.createGain();

    source.buffer = buffer;
    source.playbackRate.value = playbackRate;
    gainNode.gain.value = volumeOverride ?? this.context.getVolume();

    source.connect(gainNode);
    gainNode.connect(audioContext.destination);

    const startTime = audioContext.currentTime + Math.max(0, delaySeconds);
    source.start(startTime);

    if (soundKey) {
      this.activeSources.set(soundKey, source);
    }
  }

  startBufferAsync(
    buffer: AudioBuffer,
    delaySeconds = 0,
    soundKey?: string,
    playbackRate = 1.0,
    volumeOverride?: number,
  ): Promise<void> {
    return new Promise((resolve) => {
      const audioContext = this.context.getAudioContext();
      if (!audioContext) {
        resolve();
        return;
      }

      if (soundKey && this.activeSources.has(soundKey)) {
        try {
          const prevSource = this.activeSources.get(soundKey)!;
          prevSource.stop();
          this.activeSources.delete(soundKey);
        } catch {
          // Ignore errors from stopping already-stopped sources
        }
      }

      const source = audioContext.createBufferSource();
      const gainNode = audioContext.createGain();

      source.buffer = buffer;
      source.playbackRate.value = playbackRate;
      gainNode.gain.value = volumeOverride ?? this.context.getVolume();

      source.connect(gainNode);
      gainNode.connect(audioContext.destination);

      const startTime = audioContext.currentTime + Math.max(0, delaySeconds);
      source.start(startTime);

      if (soundKey) {
        this.activeSources.set(soundKey, source);
      }

      source.onended = () => {
        if (soundKey) {
          this.activeSources.delete(soundKey);
        }
        resolve();
      };
    });
  }

  async playWithHtmlAudio(
    key: string,
    url: string,
    playbackRate = 1.0,
    maxDuration?: number,
    volumeOverride?: number,
  ): Promise<boolean> {
    if (this.activeHtmlAudio.has(key)) {
      try {
        const prevAudio = this.activeHtmlAudio.get(key)!;

        // Wait for pause to complete to prevent overlap
        await new Promise<void>((resolve) => {
          prevAudio.pause();
          prevAudio.onpause = () => resolve();
          // Fallback if pause never fires
          setTimeout(resolve, 50);
        });

        prevAudio.currentTime = 0;
        this.activeHtmlAudio.delete(key);
      } catch {
        // Ignore errors from stopping already-stopped audio
      }
    }

    if (!this.htmlAudioCache.has(key)) {
      this.htmlAudioCache.set(key, url);
    }

    return await new Promise<boolean>((resolve) => {
      const audio = new Audio(url);
      audio.preload = "auto";
      audio.crossOrigin = "anonymous";
      audio.volume = volumeOverride ?? this.context.getVolume();
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
            `[SoundPlaybackEngine] Force-stopped "${key}" after ${maxDuration}ms`,
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

  stopAllAudio() {
    for (const [key, source] of this.activeSources.entries()) {
      try {
        source.stop();
        this.activeSources.delete(key);
      } catch {
        // Source may have already stopped
      }
    }

    for (const [key, audio] of this.activeHtmlAudio.entries()) {
      try {
        audio.pause();
        audio.currentTime = 0;
        this.activeHtmlAudio.delete(key);
      } catch {
        // Audio may have already stopped
      }
    }
  }
}
