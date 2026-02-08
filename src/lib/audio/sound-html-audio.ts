/**
 * HTMLAudio playback helper.
 */

import { eventTracker } from "../event-tracker";

export interface HtmlAudioContext {
  getVolume: () => number;
}

export class HtmlAudioPlayback {
  private htmlAudioCache = new Map<string, string>();
  private activeHtmlAudio = new Map<string, HTMLAudioElement>();

  constructor(private readonly context: HtmlAudioContext) {}

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
