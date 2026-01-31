/**
 * Speech Playback Module
 *
 * Handles speech synthesis playback and queueing.
 * Extracted from sound-manager.ts for size and clarity.
 *
 * @module audio/speech-playback
 */

import { eventTracker } from "../event-tracker";

export class SpeechPlayback {
  private speechAvailable: boolean | null = null;
  private voiceQueue: Promise<void> = Promise.resolve();
  private voiceQueueToken = 0;

  resetQueue(): void {
    this.voiceQueueToken += 1;
    this.voiceQueue = Promise.resolve();
  }

  enqueue(task: () => Promise<void>): Promise<void> {
    const token = this.voiceQueueToken;

    // Clear queue if too long to prevent audio stacking
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const synth = window.speechSynthesis;
      // Check if we're already speaking and have pending utterances
      if (synth.speaking && synth.pending) {
        // If queue appears to be backing up, clear it
        window.speechSynthesis.cancel();
        this.resetQueue();
        if (import.meta.env.DEV) {
          console.log(
            `[SpeechPlayback] Cleared speech queue to prevent stacking`,
          );
        }
      }
    }

    const run = async () => {
      if (token !== this.voiceQueueToken) return;
      await task();
    };

    this.voiceQueue = this.voiceQueue.then(run, run);
    return this.voiceQueue;
  }

  canUseSpeech(): boolean {
    if (this.speechAvailable !== null) {
      return this.speechAvailable;
    }

    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      this.speechAvailable = false;
      console.warn(
        "[SpeechPlayback] Speech synthesis not available in this environment",
      );
      return false;
    }

    this.speechAvailable = true;
    if (import.meta.env.DEV) {
      console.log("[SpeechPlayback] Speech synthesis is available");
    }
    return true;
  }

  speak(text: string, volume: number, cancelPrevious = false): boolean {
    if (import.meta.env.DEV) {
      console.log(
        `[SpeechPlayback] Attempting speech synthesis for: "${text}"`,
      );
    }

    if (!this.canUseSpeech()) {
      console.warn("[SpeechPlayback] Cannot use speech - not available");
      eventTracker.trackAudioPlayback({
        audioKey: text,
        targetName: text,
        method: "speech-synthesis",
        success: false,
        error: "not_available",
      });
      return false;
    }

    try {
      const synth = window.speechSynthesis;
      if (!synth) {
        console.warn("[SpeechPlayback] speechSynthesis object not found");
        eventTracker.trackAudioPlayback({
          audioKey: text,
          targetName: text,
          method: "speech-synthesis",
          success: false,
          error: "synth_not_found",
        });
        return false;
      }

      if (cancelPrevious && synth.speaking) {
        synth.cancel();
        if (import.meta.env.DEV) {
          console.log("[SpeechPlayback] Cancelled previous speech synthesis");
        }
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = volume;

      utterance.onstart = () => {
        if (import.meta.env.DEV) {
          console.log(`[SpeechPlayback] Started speaking: "${text}"`);
        }
        eventTracker.trackAudioPlayback({
          audioKey: text,
          targetName: text,
          method: "speech-synthesis",
          success: true,
        });
      };

      utterance.onend = () => {
        if (import.meta.env.DEV) {
          console.log(`[SpeechPlayback] Finished speaking: "${text}"`);
        }
        // Clean up handlers to prevent memory leaks
        utterance.onstart = null;
        utterance.onend = null;
        utterance.onerror = null;
      };

      utterance.onerror = (event) => {
        console.error("[SpeechPlayback] Speech synthesis error:", event);
        eventTracker.trackAudioPlayback({
          audioKey: text,
          targetName: text,
          method: "speech-synthesis",
          success: false,
          error: event.error || "unknown_error",
        });
        // Clean up handlers to prevent memory leaks
        utterance.onstart = null;
        utterance.onend = null;
        utterance.onerror = null;
      };

      synth.speak(utterance);

      if (import.meta.env.DEV) {
        console.log("[SpeechPlayback] Speech synthesis initiated successfully");
      }
      return true;
    } catch (error) {
      console.warn("[SpeechPlayback] Speech synthesis failed:", error);
      this.speechAvailable = false;
      eventTracker.trackAudioPlayback({
        audioKey: text,
        targetName: text,
        method: "speech-synthesis",
        success: false,
        error: error instanceof Error ? error.message : "exception",
      });
      return false;
    }
  }

  speakAsync(
    text: string,
    volume: number,
    cancelPrevious = false,
  ): Promise<boolean> {
    if (import.meta.env.DEV) {
      console.log(
        `[SpeechPlayback] Attempting speech synthesis for: "${text}"`,
      );
    }

    if (!this.canUseSpeech()) {
      console.warn("[SpeechPlayback] Cannot use speech - not available");
      eventTracker.trackAudioPlayback({
        audioKey: text,
        targetName: text,
        method: "speech-synthesis",
        success: false,
        error: "not_available",
      });
      return Promise.resolve(false);
    }

    const synth = window.speechSynthesis;
    if (!synth) {
      console.warn("[SpeechPlayback] speechSynthesis object not found");
      eventTracker.trackAudioPlayback({
        audioKey: text,
        targetName: text,
        method: "speech-synthesis",
        success: false,
        error: "synth_not_found",
      });
      return Promise.resolve(false);
    }

    if (cancelPrevious && synth.speaking) {
      synth.cancel();
      if (import.meta.env.DEV) {
        console.log("[SpeechPlayback] Cancelled previous speech synthesis");
      }
    }

    return new Promise<boolean>((resolve) => {
      try {
        let resolved = false;
        const cleanup = () => {
          resolved = true;
        };

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = volume;

        utterance.onstart = () => {
          if (resolved) return;
          cleanup();
          if (import.meta.env.DEV) {
            console.log(`[SpeechPlayback] Started speaking: "${text}"`);
          }
          eventTracker.trackAudioPlayback({
            audioKey: text,
            targetName: text,
            method: "speech-synthesis",
            success: true,
          });
        };

        utterance.onend = () => {
          if (resolved) return;
          cleanup();
          // Clean up handlers to prevent memory leaks
          utterance.onstart = null;
          utterance.onend = null;
          utterance.onerror = null;
          if (import.meta.env.DEV) {
            console.log(`[SpeechPlayback] Finished speaking: "${text}"`);
          }
          resolve(true);
        };

        utterance.onerror = (event) => {
          if (resolved) return;
          cleanup();
          // Clean up handlers to prevent memory leaks
          utterance.onstart = null;
          utterance.onend = null;
          utterance.onerror = null;
          console.error("[SpeechPlayback] Speech synthesis error:", event);
          eventTracker.trackAudioPlayback({
            audioKey: text,
            targetName: text,
            method: "speech-synthesis",
            success: false,
            error: event.error || "unknown_error",
          });
          resolve(false);
        };

        synth.speak(utterance);

        if (import.meta.env.DEV) {
          console.log(
            "[SpeechPlayback] Speech synthesis initiated successfully",
          );
        }

        // Safety timeout to prevent hanging
        setTimeout(() => {
          if (!resolved) {
            cleanup();
            // Clean up handlers to prevent memory leaks
            utterance.onstart = null;
            utterance.onend = null;
            utterance.onerror = null;
            console.warn(
              "[SpeechPlayback] Speech synthesis timed out after 10s",
            );
            synth.cancel(); // Stop the stuck speech
            resolve(false);
          }
        }, 10000);
      } catch (error) {
        console.warn("[SpeechPlayback] Speech synthesis failed:", error);
        this.speechAvailable = false;
        eventTracker.trackAudioPlayback({
          audioKey: text,
          targetName: text,
          method: "speech-synthesis",
          success: false,
          error: error instanceof Error ? error.message : "exception",
        });
        resolve(false);
      }
    });
  }
}
