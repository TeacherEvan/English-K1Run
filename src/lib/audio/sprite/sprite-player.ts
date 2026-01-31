/**
 * Audio Sprite Player
 *
 * Handles playback of audio sprite clips using Web Audio API
 * with HTMLAudio fallback.
 *
 * @module audio/sprite/sprite-player
 */

import { calculatePercentageWithinBounds } from "../../semantic-utils";
import type { AudioSpriteClip, AudioSpritePlayOptions } from "./sprite-types";

export class SpritePlaybackEngine {
  private audioContext: AudioContext | null = null;
  private activeSource: AudioBufferSourceNode | null = null;
  private activeHtmlAudio: HTMLAudioElement | null = null;

  setAudioContext(ctx: AudioContext): void {
    this.audioContext = ctx;
  }

  stop(): void {
    if (this.activeSource) {
      try {
        this.activeSource.stop();
      } catch {
        // ignore
      }
      this.activeSource = null;
    }

    if (this.activeHtmlAudio) {
      try {
        this.activeHtmlAudio.pause();
        this.activeHtmlAudio.currentTime = 0;
      } catch {
        // ignore
      }
      this.activeHtmlAudio = null;
    }
  }

  async playWithWebAudio(
    buffer: AudioBuffer,
    clip: AudioSpriteClip,
    options?: AudioSpritePlayOptions,
  ): Promise<boolean> {
    if (!this.audioContext) return false;

    this.stop();

    const playbackRate = options?.playbackRate ?? 1.0;
    const volume = calculatePercentageWithinBounds(
      options?.volume ?? 0.6,
      0,
      1,
    );
    const clipStart = Math.max(0, clip.start);
    const clipEnd = Math.max(clipStart, clip.end);
    const durationSeconds = clipEnd - clipStart;
    const maxDurationMs =
      options?.maxDuration ?? Math.ceil(durationSeconds * 1000) + 250;

    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();

    source.buffer = buffer;
    source.playbackRate.value = playbackRate;
    gainNode.gain.value = volume;

    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    const safeOffset = calculatePercentageWithinBounds(
      clipStart,
      0,
      buffer.duration,
    );
    const safeDuration = calculatePercentageWithinBounds(
      durationSeconds,
      0,
      buffer.duration - safeOffset,
    );

    return new Promise<boolean>((resolve) => {
      const safetyTimer = window.setTimeout(() => {
        try {
          source.stop();
        } catch {
          // ignore
        }
      }, maxDurationMs);

      source.onended = () => {
        window.clearTimeout(safetyTimer);
        if (this.activeSource === source) {
          this.activeSource = null;
        }
        resolve(true);
      };

      try {
        source.start(this.audioContext!.currentTime, safeOffset, safeDuration);
        this.activeSource = source;
      } catch {
        window.clearTimeout(safetyTimer);
        resolve(false);
      }
    });
  }

  async playWithHtmlAudio(
    spriteUrl: string,
    clip: AudioSpriteClip,
    options?: AudioSpritePlayOptions,
  ): Promise<boolean> {
    this.stop();

    const volume = calculatePercentageWithinBounds(
      options?.volume ?? 0.6,
      0,
      1,
    );
    const playbackRate = options?.playbackRate ?? 1.0;
    const clipStart = Math.max(0, clip.start);
    const clipEnd = Math.max(clipStart, clip.end);
    const durationSeconds = clipEnd - clipStart;
    const maxDurationMs =
      options?.maxDuration ?? Math.ceil(durationSeconds * 1000) + 250;

    return new Promise<boolean>((resolve) => {
      const audio = new Audio(spriteUrl);
      audio.preload = "auto";
      audio.crossOrigin = "anonymous";
      audio.volume = volume;
      audio.playbackRate = playbackRate;
      this.activeHtmlAudio = audio;

      let stopTimer: number | undefined;

      const cleanup = (success: boolean) => {
        audio.removeEventListener("error", onError);
        audio.removeEventListener("loadedmetadata", onLoaded);
        if (stopTimer !== undefined) window.clearTimeout(stopTimer);
        resolve(success);
      };

      const stopNow = () => {
        try {
          audio.pause();
          audio.currentTime = 0;
        } catch {
          // ignore
        }
        cleanup(true);
      };

      const onError = () => cleanup(false);

      const onLoaded = () => {
        try {
          audio.currentTime = clipStart;
        } catch {
          // ignore
        }

        audio.play().then(
          () => {
            stopTimer = window.setTimeout(stopNow, maxDurationMs);
          },
          () => cleanup(false),
        );
      };

      audio.addEventListener("error", onError, { once: true });
      audio.addEventListener("loadedmetadata", onLoaded, { once: true });
      audio.load();
    });
  }
}

export const spritePlaybackEngine = new SpritePlaybackEngine();
