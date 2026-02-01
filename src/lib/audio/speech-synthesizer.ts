/**
 * Speech Synthesizer Module (Refactored)
 *
 * Unified text-to-speech interface using ElevenLabs API (primary)
 * with Web Speech API fallback.
 *
 * Refactored Jan 2026: Split from 494 lines to <200 lines.
 *
 * @module audio/speech-synthesizer
 */

import type { SupportedLanguage } from "@/lib/constants/language-config";
import {
  generateSpeech,
  playAudioBuffer,
  stopAudioBufferPlayback,
  testElevenLabsConnection,
} from "./speech/elevenlabs-client";
import {
  isWebSpeechAvailable,
  stopSpeech,
  speak as webSpeak,
  speakAsync as webSpeakAsync,
} from "./speech/web-speech-client";
import type { SpeechOptions } from "./types";

export class SpeechSynthesizer {
  private elevenLabsAvailable: boolean | null = null;
  private defaultVolume = 0.6;
  private currentLanguage: SupportedLanguage = "en";
  private audioCache = new Map<string, ArrayBuffer>();
  private static readonly MAX_CACHE_SIZE = 50;

  constructor() {
    this.checkElevenLabsAvailability();
  }

  private async checkElevenLabsAvailability(): Promise<void> {
    try {
      this.elevenLabsAvailable = await testElevenLabsConnection();
    } catch {
      this.elevenLabsAvailable = false;
    }
  }

  canUseElevenLabs(): boolean {
    return this.elevenLabsAvailable === true;
  }

  canUseSpeech(): boolean {
    return this.elevenLabsAvailable === true || isWebSpeechAvailable();
  }

  stop(): void {
    stopAudioBufferPlayback();
    stopSpeech();
  }

  speak(
    text: string,
    options?: SpeechOptions & { langCode?: SupportedLanguage },
    cancelPrevious = false,
  ): boolean {
    if (!text.trim()) return false;

    if (cancelPrevious) this.stop();

    // Try ElevenLabs first
    if (this.canUseElevenLabs()) {
      this.speakWithElevenLabs(text, options).catch(() => {
        // Fallback to Web Speech on failure
        this.speakWithWebSpeech(text, options);
      });
      return true;
    }

    // Fallback to Web Speech
    return this.speakWithWebSpeech(text, options);
  }

  private async speakWithElevenLabs(
    text: string,
    options?: SpeechOptions & { langCode?: SupportedLanguage },
  ): Promise<void> {
    const cacheKey = `${this.currentLanguage}-${text}`;
    let audioBuffer = this.audioCache.get(cacheKey);

    if (!audioBuffer) {
      const generated = await generateSpeech({
        text,
        languageCode: options?.langCode || this.currentLanguage,
        volume: options?.volume || this.defaultVolume,
        rate: options?.rate,
        pitch: options?.pitch,
      });
      if (!generated) throw new Error("Failed to generate speech");
      audioBuffer = generated;
      this.setCacheEntry(cacheKey, audioBuffer);
    }

    await playAudioBuffer(audioBuffer, {
      rate: options?.rate,
      volume: options?.volume || this.defaultVolume,
    });
  }

  private speakWithWebSpeech(
    text: string,
    options?: SpeechOptions & { langCode?: SupportedLanguage },
  ): boolean {
    return webSpeak({
      text,
      rate: options?.rate,
      pitch: options?.pitch,
      volume: options?.volume || this.defaultVolume,
      langCode: options?.langCode || this.currentLanguage,
    });
  }

  speakAsync(
    text: string,
    options?: SpeechOptions & { langCode?: SupportedLanguage },
  ): Promise<boolean> {
    if (!text.trim()) return Promise.resolve(false);

    // Try ElevenLabs first
    if (this.canUseElevenLabs()) {
      return this.speakAsyncWithElevenLabs(text, options).catch(() => {
        return webSpeakAsync({
          text,
          rate: options?.rate,
          pitch: options?.pitch,
          volume: options?.volume || this.defaultVolume,
          langCode: options?.langCode || this.currentLanguage,
        });
      });
    }

    // Fallback to Web Speech
    return webSpeakAsync({
      text,
      rate: options?.rate,
      pitch: options?.pitch,
      volume: options?.volume || this.defaultVolume,
      langCode: options?.langCode || this.currentLanguage,
    });
  }

  private async speakAsyncWithElevenLabs(
    text: string,
    options?: SpeechOptions & { langCode?: SupportedLanguage },
  ): Promise<boolean> {
    try {
      const cacheKey = `${this.currentLanguage}-${text}`;
      let audioBuffer = this.audioCache.get(cacheKey);

      if (!audioBuffer) {
        const generated = await generateSpeech({
          text,
          languageCode: options?.langCode || this.currentLanguage,
          volume: options?.volume || this.defaultVolume,
        });
        if (!generated) throw new Error("Failed to generate speech");
        audioBuffer = generated;
        this.setCacheEntry(cacheKey, audioBuffer);
      }

      await playAudioBuffer(audioBuffer, {
        volume: options?.volume || this.defaultVolume,
      });
      return true;
    } catch {
      return false;
    }
  }

  setVolume(volume: number): void {
    this.defaultVolume = Math.max(0, Math.min(1, volume));
  }

  private setCacheEntry(key: string, value: ArrayBuffer): void {
    this.audioCache.set(key, value);
    if (this.audioCache.size <= SpeechSynthesizer.MAX_CACHE_SIZE) return;
    const oldestKey = this.audioCache.keys().next().value as string | undefined;
    if (oldestKey) {
      this.audioCache.delete(oldestKey);
    }
  }

  setLanguage(langCode: SupportedLanguage): void {
    this.currentLanguage = langCode;
  }

  getLanguage(): SupportedLanguage {
    return this.currentLanguage;
  }

  isAvailable(): boolean | null {
    if (this.elevenLabsAvailable === true) return true;
    return isWebSpeechAvailable();
  }
}

export const speechSynthesizer = new SpeechSynthesizer();
