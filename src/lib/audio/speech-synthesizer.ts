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

import type { SupportedLanguage } from "@/lib/constants/language-config";
import type { SpeechOptions } from "./types";

/**
 * Speech Synthesizer class
 * Manages text-to-speech functionality
 */
export class SpeechSynthesizer {
  private speechAvailable: boolean | null = null;
  private defaultVolume = 0.6;
  private currentLanguage: SupportedLanguage = "en";

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
   * Get preferred voice for a specific language
   * @param langCode - Language code (e.g., 'en', 'fr', 'ja', 'th', 'zh-CN')
   */
  getPreferredVoice(langCode?: SupportedLanguage): SpeechSynthesisVoice | null {
    const voices = this.getVoices();
    if (voices.length === 0) return null;

    const targetLang = langCode || this.currentLanguage;

    // Map language codes to speech synthesis language prefixes
    const langPrefixMap: Record<SupportedLanguage, string[]> = {
      en: ["en"],
      fr: ["fr"],
      ja: ["ja"],
      th: ["th"],
      "zh-CN": ["zh-CN", "zh"],
      "zh-HK": ["zh-HK", "zh"],
    };

    const langPrefixes = langPrefixMap[targetLang];
    if (!langPrefixes) {
      // Fallback to English if language not found
      return this.getPreferredVoice("en");
    }

    // Filter voices by language
    const langVoices = voices.filter((v) =>
      langPrefixes.some((prefix) => v.lang.startsWith(prefix))
    );

    if (langVoices.length > 0) {
      // Return first matching voice
      return langVoices[0];
    }

    // If no exact match, try to find any voice for the base language
    const basePrefix = langPrefixes[0];
    const baseVoices = voices.filter((v) =>
      v.lang.startsWith(basePrefix.substring(0, 2))
    );
    if (baseVoices.length > 0) {
      return baseVoices[0];
    }

    // Last resort: return first available voice
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
    options?: SpeechOptions & { langCode?: SupportedLanguage },
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
      const langCode = options?.langCode || this.currentLanguage;

      // Apply options
      utterance.pitch = options?.pitch ?? 1.0;
      utterance.rate = options?.rate ?? 1.0;
      utterance.volume = options?.volume ?? this.defaultVolume;

      // Try to set preferred voice for the language
      const voice = this.getPreferredVoice(langCode);
      if (voice) {
        utterance.voice = voice;
      }

      synth.speak(utterance);

      if (import.meta.env.DEV) {
        console.log(`[SpeechSynthesizer] Speaking (${langCode}): "${text}"`);
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
  speakAsync(
    text: string,
    options?: SpeechOptions & { langCode?: SupportedLanguage }
  ): Promise<boolean> {
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
        const langCode = options?.langCode || this.currentLanguage;

        utterance.pitch = options?.pitch ?? 1.0;
        utterance.rate = options?.rate ?? 1.0;
        utterance.volume = options?.volume ?? this.defaultVolume;

        const voice = this.getPreferredVoice(langCode);
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

  /**
   * Set current language for speech synthesis
   */
  setLanguage(langCode: SupportedLanguage): void {
    this.currentLanguage = langCode;
  }

  /**
   * Get current language setting
   */
  getLanguage(): SupportedLanguage {
    return this.currentLanguage;
  }
}

// Export singleton instance
export const speechSynthesizer = new SpeechSynthesizer();
