/**
 * Speech Playback Module
 *
 * Handles speech synthesis playback and queueing.
 * Extracted from sound-manager.ts for size and clarity.
 *
 * @module audio/speech-playback
 */

import type { SupportedLanguage } from "../constants/language-config";
import { eventTracker } from "../event-tracker";
import {
  getPreferredVoice,
  hasPreferredVoice,
} from "./speech/web-speech-client";

const SPEECH_TIMEOUT_MS = 10000;

const trackFailure = (text: string, error: string) => {
  eventTracker.trackAudioPlayback({
    audioKey: text,
    targetName: text,
    method: "speech-synthesis",
    success: false,
    error,
  });
};

const clearUtteranceHandlers = (utterance: SpeechSynthesisUtterance) => {
  utterance.onstart = null;
  utterance.onend = null;
  utterance.onerror = null;
};

export class SpeechPlayback {
  private speechAvailable: boolean | null = null;
  private voiceQueue: Promise<void> = Promise.resolve();
  private voiceQueueToken = 0;
  private currentLanguage: SupportedLanguage = "en";

  setLanguage(langCode: SupportedLanguage): void {
    this.currentLanguage = langCode;
  }

  resetQueue(): void {
    this.voiceQueueToken += 1;
    this.voiceQueue = Promise.resolve();
  }

  enqueue(task: () => Promise<void>): Promise<void> {
    const token = this.voiceQueueToken;
    const synth = typeof window !== "undefined" ? window.speechSynthesis : null;

    if (synth?.speaking && synth.pending) {
      synth.cancel();
      this.resetQueue();
      if (import.meta.env.DEV) {
        console.log(
          "[SpeechPlayback] Cleared speech queue to prevent stacking",
        );
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

    if (typeof window === "undefined" || !window.speechSynthesis) {
      this.speechAvailable = false;
      console.warn("[SpeechPlayback] Speech synthesis not available");
      return false;
    }

    window.speechSynthesis.getVoices();
    this.speechAvailable = true;
    return true;
  }

  private createUtterance(text: string, volume: number) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = volume;
    utterance.lang = this.currentLanguage;

    const voice = getPreferredVoice(this.currentLanguage);
    if (voice) {
      utterance.voice = voice;
    }

    return utterance;
  }

  private canUseLanguageVoice(text: string): boolean {
    if (this.currentLanguage === "en") {
      return true;
    }

    if (hasPreferredVoice(this.currentLanguage)) {
      return true;
    }

    trackFailure(text, "voice_not_available");
    if (import.meta.env.DEV) {
      console.warn(
        `[SpeechPlayback] No matching voice available for ${this.currentLanguage}; skipping cross-language fallback.`,
      );
    }
    return false;
  }

  speak(text: string, volume: number, cancelPrevious = false): boolean {
    if (!this.canUseSpeech()) {
      trackFailure(text, "not_available");
      return false;
    }

    const synth = window.speechSynthesis;
    if (!synth) {
      trackFailure(text, "synth_not_found");
      return false;
    }

    if (!this.canUseLanguageVoice(text)) {
      return false;
    }

    try {
      if (cancelPrevious && synth.speaking) {
        synth.cancel();
      }

      const utterance = this.createUtterance(text, volume);
      utterance.onstart = () => {
        eventTracker.trackAudioPlayback({
          audioKey: text,
          targetName: text,
          method: "speech-synthesis",
          success: true,
        });
      };
      utterance.onend = () => clearUtteranceHandlers(utterance);
      utterance.onerror = (event) => {
        console.error("[SpeechPlayback] Speech synthesis error:", event);
        trackFailure(text, event.error || "unknown_error");
        clearUtteranceHandlers(utterance);
      };

      synth.speak(utterance);
      return true;
    } catch (error) {
      this.speechAvailable = false;
      trackFailure(text, error instanceof Error ? error.message : "exception");
      return false;
    }
  }

  speakAsync(
    text: string,
    volume: number,
    cancelPrevious = false,
  ): Promise<boolean> {
    if (!this.canUseSpeech()) {
      trackFailure(text, "not_available");
      return Promise.resolve(false);
    }

    const synth = window.speechSynthesis;
    if (!synth) {
      trackFailure(text, "synth_not_found");
      return Promise.resolve(false);
    }

    if (!this.canUseLanguageVoice(text)) {
      return Promise.resolve(false);
    }

    if (cancelPrevious && synth.speaking) {
      synth.cancel();
    }

    return new Promise<boolean>((resolve) => {
      try {
        let started = false;
        let settled = false;
        const utterance = this.createUtterance(text, volume);
        let timeoutId = 0;

        const settle = (result: boolean, error?: string) => {
          if (settled) return;
          settled = true;
          window.clearTimeout(timeoutId);
          clearUtteranceHandlers(utterance);
          if (error) {
            trackFailure(text, error);
          }
          resolve(result);
        };

        utterance.onstart = () => {
          started = true;
          eventTracker.trackAudioPlayback({
            audioKey: text,
            targetName: text,
            method: "speech-synthesis",
            success: true,
          });
        };
        utterance.onend = () => settle(true);
        utterance.onerror = (event) => {
          console.error("[SpeechPlayback] Speech synthesis error:", event);
          settle(false, event.error || "unknown_error");
        };

        synth.speak(utterance);

        timeoutId = window.setTimeout(() => {
          if (settled) return;
          console.warn("[SpeechPlayback] Speech synthesis timed out after 10s");
          synth.cancel();
          settle(started, started ? undefined : "timeout");
        }, SPEECH_TIMEOUT_MS);
      } catch (error) {
        this.speechAvailable = false;
        trackFailure(
          text,
          error instanceof Error ? error.message : "exception",
        );
        resolve(false);
      }
    });
  }
}
