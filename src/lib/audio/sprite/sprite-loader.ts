/**
 * Audio Sprite Loader
 *
 * Handles loading of audio sprite manifests and audio buffers.
 *
 * @module audio/sprite/sprite-loader
 */

import type {
  AudioSpriteConfigureOptions,
  AudioSpriteManifest,
} from "./sprite-types";

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

export class SpriteLoader {
  private spriteUrl: string | null = null;
  private manifestUrl: string | null = null;
  private manifest: AudioSpriteManifest | null = null;
  private manifestPromise: Promise<AudioSpriteManifest | null> | null = null;
  private buffer: AudioBuffer | null = null;
  private bufferPromise: Promise<AudioBuffer | null> | null = null;
  private audioContext: AudioContext | null = null;

  configure(options: AudioSpriteConfigureOptions): void {
    this.spriteUrl = options.spriteUrl;
    this.manifestUrl = options.manifestUrl;
  }

  setAudioContext(ctx: AudioContext): void {
    this.audioContext = ctx;
  }

  isConfigured(): boolean {
    return !!this.spriteUrl && !!this.manifestUrl;
  }

  async loadManifest(): Promise<AudioSpriteManifest | null> {
    if (!this.isConfigured() || !this.manifestUrl) return null;
    if (this.manifest) return this.manifest;
    if (this.manifestPromise) return this.manifestPromise;

    this.manifestPromise = (async () => {
      try {
        const response = await fetchWithRetry(this.manifestUrl!);
        const parsed = (await response.json()) as AudioSpriteManifest;

        if (!parsed || typeof parsed !== "object" || !parsed.clips) {
          throw new Error("Invalid audio sprite manifest");
        }

        if (parsed.spriteUrl) {
          this.spriteUrl = parsed.spriteUrl;
        }

        this.manifest = parsed;
        return parsed;
      } catch (error) {
        console.warn("[SpriteLoader] Failed to load manifest:", error);
        this.manifest = null;
        return null;
      } finally {
        this.manifestPromise = null;
      }
    })();

    return this.manifestPromise;
  }

  async loadBuffer(): Promise<AudioBuffer | null> {
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
        console.warn("[SpriteLoader] Failed to load/decode sprite:", error);
        this.buffer = null;
        return null;
      } finally {
        this.bufferPromise = null;
      }
    })();

    return this.bufferPromise;
  }

  getManifest(): AudioSpriteManifest | null {
    return this.manifest;
  }

  getBuffer(): AudioBuffer | null {
    return this.buffer;
  }

  reset(): void {
    this.manifest = null;
    this.buffer = null;
    this.manifestPromise = null;
    this.bufferPromise = null;
  }
}

export const spriteLoader = new SpriteLoader();
