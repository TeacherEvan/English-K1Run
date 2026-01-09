/**
 * Speech Synthesizer Module
 *
 * Handles text-to-speech functionality using Web Speech API.
 * Split from sound-manager.ts (Jan 2026) for better code organization.
 *
 * Responsibilities:
 * - Speech synthesis availability detection
 * - Voice selection
 * - Utterance creation and playback
 * - Fallback handling
 *
 * @module audio/speech-synthesizer
 */

import type { SpeechOptions } from "./types";

/**
 * Speech Synthesizer class
 * Manages text-to-speech functionality
 */
export class SpeechSynthesizer {
  private speechAvailable: boolean | null = null;
  private defaultVolume = 0.6;

  constructor() {
    this.checkAvailability();
  }

  /**
   * Check if speech synthesis is available
   */
  private checkAvailability(): void {
    if (typeof window === "undefined") {
      this.speechAvailable = false;
      return;
    }

    try {
      const synth = window.speechSynthesis;
      if (!synth) {
        this.speechAvailable = false;
        return;
      }

      // Check for voices - some browsers need a delay
      const voices = synth.getVoices();
      if (voices.length > 0) {
        this.speechAvailable = true;
        return;
      }

      // Set up listener for voice loading
      synth.addEventListener(
        "voiceschanged",
        () => {
          const updatedVoices = synth.getVoices();
          this.speechAvailable = updatedVoices.length > 0;
          if (import.meta.env.DEV) {
            console.log(
              `[SpeechSynthesizer] Voices loaded: ${updatedVoices.length}`
            );
          }
        },
        { once: true }
      );

      // Assume available until we know otherwise
      this.speechAvailable = true;
    } catch {
      this.speechAvailable = false;
    }
  }

  /**
   * Check if speech synthesis can be used
   */
  canUseSpeech(): boolean {
    if (this.speechAvailable === null) {
      this.checkAvailability();
    }
    return this.speechAvailable === true;
  }

  /**
   * Get available voices
   */
  getVoices(): SpeechSynthesisVoice[] {
    if (!this.canUseSpeech()) return [];
    return window.speechSynthesis?.getVoices() ?? [];
  }

  /**
   * Get preferred English voice
   */
  getPreferredVoice(): SpeechSynthesisVoice | null {
    const voices = this.getVoices();
    if (voices.length === 0) return null;

    // Prefer English voices
    const englishVoices = voices.filter((v) => v.lang.startsWith("en"));
    if (englishVoices.length > 0) {
      // Prefer US English, then any English
      const usVoice = englishVoices.find((v) => v.lang === "en-US");
      return usVoice || englishVoices[0];
    }

    return voices[0];
  }

  /**
   * Stop all ongoing speech
   */
  stop(): void {
    if (!this.canUseSpeech()) return;
    try {
      window.speechSynthesis?.cancel();
    } catch (error) {
      console.warn("[SpeechSynthesizer] Failed to stop speech:", error);
    }
  }

  /**
   * Speak text using speech synthesis
   * @returns true if speech started successfully
   */
  speak(
    text: string,
    options?: SpeechOptions,
    cancelPrevious = false
  ): boolean {
    if (!this.canUseSpeech() || !text.trim()) return false;

    try {
      const synth = window.speechSynthesis;
      if (!synth) return false;

      if (cancelPrevious) {
        synth.cancel();
      }

      const utterance = new SpeechSynthesisUtterance(text);

      // Apply options
      utterance.pitch = options?.pitch ?? 1.0;
      utterance.rate = options?.rate ?? 1.0;
      utterance.volume = options?.volume ?? this.defaultVolume;

      // Try to set preferred voice
      const voice = this.getPreferredVoice();
      if (voice) {
        utterance.voice = voice;
      }

      synth.speak(utterance);

      if (import.meta.env.DEV) {
        console.log(`[SpeechSynthesizer] Speaking: "${text}"`);
      }

      return true;
    } catch (error) {
      console.warn("[SpeechSynthesizer] Failed to speak:", error);
      return false;
    }
  }

  /**
   * Speak with promise that resolves when done
   */
  speakAsync(text: string, options?: SpeechOptions): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.canUseSpeech() || !text.trim()) {
        resolve(false);
        return;
      }

      try {
        const synth = window.speechSynthesis;
        if (!synth) {
          resolve(false);
          return;
        }

        const utterance = new SpeechSynthesisUtterance(text);

        utterance.pitch = options?.pitch ?? 1.0;
        utterance.rate = options?.rate ?? 1.0;
        utterance.volume = options?.volume ?? this.defaultVolume;

        const voice = this.getPreferredVoice();
        if (voice) {
          utterance.voice = voice;
        }

        utterance.onend = () => resolve(true);
        utterance.onerror = () => resolve(false);

        synth.speak(utterance);
      } catch {
        resolve(false);
      }
    });
  }

  /**
   * Set default volume for speech
   */
  setVolume(volume: number): void {
    this.defaultVolume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Check availability status
   */
  isAvailable(): boolean | null {
    return this.speechAvailable;
  }
}

// Export singleton instance
export const speechSynthesizer = new SpeechSynthesizer();
