/**
 * Audio Sprite Player (Refactored)
 *
 * Supports playing multiple logical clips from a single large audio file using
 * a JSON manifest of start/end offsets.
 *
 * Refactored Jan 2026: Split from 402 lines to <200 lines.
 *
 * @module audio/audio-sprite
 */

import { eventTracker } from "../event-tracker";
import { spriteLoader } from "./sprite/sprite-loader";
import { spritePlaybackEngine } from "./sprite/sprite-player";
import type {
  AudioSpriteConfigureOptions,
  AudioSpritePlayOptions,
} from "./sprite/sprite-types";

export class AudioSpritePlayer {
  private configured = false;

  configure(options: AudioSpriteConfigureOptions): void {
    spriteLoader.configure(options);
    this.configured = true;
  }

  setAudioContext(ctx: AudioContext): void {
    spriteLoader.setAudioContext(ctx);
    spritePlaybackEngine.setAudioContext(ctx);
  }

  isConfigured(): boolean {
    return this.configured && spriteLoader.isConfigured();
  }

  async loadManifest() {
    return spriteLoader.loadManifest();
  }

  async prefetch(): Promise<boolean> {
    const manifest = await spriteLoader.loadManifest();
    if (!manifest) return false;
    if (!spriteLoader.getBuffer()) {
      await spriteLoader.loadBuffer();
    }
    return spriteLoader.getBuffer() !== null;
  }

  hasClip(name: string): boolean {
    return !!spriteLoader.getManifest()?.clips?.[name];
  }

  stop(): void {
    spritePlaybackEngine.stop();
  }

  async playClip(
    clipName: string,
    options?: AudioSpritePlayOptions,
  ): Promise<boolean> {
    const startTime = performance.now();

    try {
      const manifest = await spriteLoader.loadManifest();
      const clip = manifest?.clips?.[clipName];

      if (!manifest || !clip) {
        return false;
      }

      const buffer = await spriteLoader.loadBuffer();
      const spriteUrl = manifest.spriteUrl || spriteLoader["spriteUrl"] || null;

      // Prefer Web Audio (best sync + easiest trimming)
      if (buffer) {
        const played = await spritePlaybackEngine.playWithWebAudio(
          buffer,
          clip,
          options,
        );
        if (played) {
          eventTracker.trackAudioPlayback({
            audioKey: clipName,
            targetName: clipName,
            method: "audio-sprite",
            success: true,
            duration: performance.now() - startTime,
          });
          return true;
        }
      }

      // HTMLAudio fallback: seek + timed stop
      if (spriteUrl) {
        const played = await spritePlaybackEngine.playWithHtmlAudio(
          spriteUrl,
          clip,
          options,
        );
        eventTracker.trackAudioPlayback({
          audioKey: clipName,
          targetName: clipName,
          method: "audio-sprite",
          success: played,
          duration: performance.now() - startTime,
        });
        return played;
      }

      return false;
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
