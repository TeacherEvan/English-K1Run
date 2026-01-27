/**
 * Audio Sprite Player
 *
 * Supports playing multiple logical clips from a single large audio file using
 * a JSON manifest of start/end offsets.
 *
 * This is optional and feature-flagged; it does not replace per-file audio.
 */

import { eventTracker } from "../event-tracker";
import { calculatePercentageWithinBounds } from "../semantic-utils";

export interface AudioSpriteClip {
  /** Start time in seconds */
  start: number;
  /** End time in seconds */
  end: number;
  /** Optional human-readable description for accessibility */
  description?: string;
}

export interface AudioSpriteManifest {
  version?: number;
  spriteUrl?: string;
  clips: Record<string, AudioSpriteClip>;
}

export interface AudioSpriteConfigureOptions {
  spriteUrl: string;
  manifestUrl: string;
}

export interface AudioSpritePlayOptions {
  volume?: number;
  playbackRate?: number;
  /** Maximum duration in ms before force-stopping (safety) */
  maxDuration?: number;
}

async function fetchWithRetry(
  url: string,
  init?: RequestInit,
  retries = 2,
  retryDelayMs = 250,
): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 15000);

      const response = await fetch(url, {
        ...init,
        signal: init?.signal ?? controller.signal,
      });

      window.clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (error) {
      lastError = error;
      if (attempt >= retries) break;
      await new Promise((r) => window.setTimeout(r, retryDelayMs));
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Failed to fetch resource");
}

export class AudioSpritePlayer {
  private audioContext: AudioContext | null = null;
  private configured = false;
  private spriteUrl: string | null = null;
  private manifestUrl: string | null = null;

  private manifest: AudioSpriteManifest | null = null;
  private manifestPromise: Promise<AudioSpriteManifest | null> | null = null;

  private buffer: AudioBuffer | null = null;
  private bufferPromise: Promise<AudioBuffer | null> | null = null;

  private activeSource: AudioBufferSourceNode | null = null;
  private activeHtmlAudio: HTMLAudioElement | null = null;

  configure(options: AudioSpriteConfigureOptions): void {
    this.spriteUrl = options.spriteUrl;
    this.manifestUrl = options.manifestUrl;
    this.configured = true;
  }

  setAudioContext(ctx: AudioContext): void {
    this.audioContext = ctx;
  }

  isConfigured(): boolean {
    return this.configured && !!this.spriteUrl && !!this.manifestUrl;
  }

  async loadManifest(): Promise<AudioSpriteManifest | null> {
    if (!this.isConfigured() || !this.manifestUrl) return null;
    if (this.manifest) return this.manifest;
    if (this.manifestPromise) return this.manifestPromise;

    this.manifestPromise = (async () => {
      try {
        const response = await fetchWithRetry(this.manifestUrl!);
        const parsed = (await response.json()) as AudioSpriteManifest;

        // Basic validation
        if (!parsed || typeof parsed !== "object" || !parsed.clips) {
          throw new Error("Invalid audio sprite manifest");
        }

        // Allow manifest to override sprite URL (handy for CDNs)
        if (parsed.spriteUrl) {
          this.spriteUrl = parsed.spriteUrl;
        }

        this.manifest = parsed;
        return parsed;
      } catch (error) {
        console.warn("[AudioSpritePlayer] Failed to load manifest:", error);
        this.manifest = null;
        return null;
      } finally {
        this.manifestPromise = null;
      }
    })();

    return this.manifestPromise;
  }

  private async ensureBufferLoaded(): Promise<AudioBuffer | null> {
    if (!this.audioContext) return null;
    if (!this.isConfigured() || !this.spriteUrl) return null;

    if (this.buffer) return this.buffer;
    if (this.bufferPromise) return this.bufferPromise;

    this.bufferPromise = (async () => {
      try {
        const response = await fetchWithRetry(this.spriteUrl!);
        const arrayBuffer = await response.arrayBuffer();
        const decoded = await this.audioContext!.decodeAudioData(arrayBuffer);
        this.buffer = decoded;
        return decoded;
      } catch (error) {
        console.warn(
          "[AudioSpritePlayer] Failed to load/decode sprite:",
          error,
        );
        this.buffer = null;
        return null;
      } finally {
        this.bufferPromise = null;
      }
    })();

    return this.bufferPromise;
  }

  hasClip(name: string): boolean {
    return !!this.manifest?.clips?.[name];
  }

  getClip(name: string): AudioSpriteClip | null {
    return this.manifest?.clips?.[name] ?? null;
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

  async prefetch(): Promise<boolean> {
    const manifest = await this.loadManifest();
    if (!manifest) return false;
    if (!this.audioContext) return true;
    const buffer = await this.ensureBufferLoaded();
    return buffer !== null;
  }

  async playClip(
    clipName: string,
    options?: AudioSpritePlayOptions,
  ): Promise<boolean> {
    const startTime = performance.now();

    try {
      const manifest = await this.loadManifest();
      const clip = manifest?.clips?.[clipName];

      if (!manifest || !clip || !this.spriteUrl) {
        return false;
      }

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

      // Prefer Web Audio (best sync + easiest trimming)
      if (this.audioContext) {
        const buffer = await this.ensureBufferLoaded();
        if (!buffer) return false;

        // Stop previous sprite playback
        this.stop();

        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.playbackRate.value = playbackRate;

        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = volume;

        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        // Ensure we never play beyond buffer
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

        return await new Promise<boolean>((resolve) => {
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

            eventTracker.trackAudioPlayback({
              audioKey: clipName,
              targetName: clipName,
              method: "audio-sprite",
              success: true,
              duration: performance.now() - startTime,
            });

            resolve(true);
          };

          try {
            source.start(
              this.audioContext!.currentTime,
              safeOffset,
              safeDuration,
            );
            this.activeSource = source;
          } catch (error) {
            window.clearTimeout(safetyTimer);
            eventTracker.trackAudioPlayback({
              audioKey: clipName,
              targetName: clipName,
              method: "audio-sprite",
              success: false,
              error: error instanceof Error ? error.message : "start_error",
              duration: performance.now() - startTime,
            });
            resolve(false);
          }
        });
      }

      // HTMLAudio fallback: seek + timed stop
      this.stop();

      return await new Promise<boolean>((resolve) => {
        const audio = new Audio(this.spriteUrl!);
        audio.preload = "auto";
        audio.crossOrigin = "anonymous";
        audio.volume = volume;
        audio.playbackRate = playbackRate;
        this.activeHtmlAudio = audio;

        let stopTimer: number | undefined;

        const cleanup = (success: boolean, error?: string) => {
          audio.removeEventListener("error", onError);
          audio.removeEventListener("loadedmetadata", onLoaded);
          if (stopTimer !== undefined) window.clearTimeout(stopTimer);

          if (!success) {
            eventTracker.trackAudioPlayback({
              audioKey: clipName,
              targetName: clipName,
              method: "audio-sprite",
              success: false,
              error,
              duration: performance.now() - startTime,
            });
          } else {
            eventTracker.trackAudioPlayback({
              audioKey: clipName,
              targetName: clipName,
              method: "audio-sprite",
              success: true,
              duration: performance.now() - startTime,
            });
          }

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

        const onError = () => {
          cleanup(false, "playback_error");
        };

        const onLoaded = () => {
          // Seeking before metadata can fail; wait for metadata
          try {
            audio.currentTime = clipStart;
          } catch {
            // ignore
          }

          audio.play().then(
            () => {
              stopTimer = window.setTimeout(stopNow, maxDurationMs);
            },
            () => cleanup(false, "play_error"),
          );
        };

        audio.addEventListener("error", onError, { once: true });
        audio.addEventListener("loadedmetadata", onLoaded, { once: true });

        // Kick off load
        audio.load();
      });
    } catch (error) {
      console.warn("[AudioSpritePlayer] playClip failed:", error);
      eventTracker.trackAudioPlayback({
        audioKey: clipName,
        targetName: clipName,
        method: "audio-sprite",
        success: false,
        error: error instanceof Error ? error.message : "exception",
        duration: performance.now() - startTime,
      });
      return false;
    }
  }
}

export const audioSpritePlayer = new AudioSpritePlayer();
