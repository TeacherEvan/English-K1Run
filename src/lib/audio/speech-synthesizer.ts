/**
 * Speech Synthesizer Module
 *
 * Handles text-to-speech functionality using ElevenLabs API with Web Speech API fallback.
 * Split from sound-manager.ts (Jan 2026) for better code organization.
 *
 * Responsibilities:
 * - Speech synthesis availability detection (ElevenLabs API primary, Web Speech API fallback)
 * - Voice selection and API integration
 * - Audio generation and playback
 * - Fallback handling for offline/network issues
 *
 * @module audio/speech-synthesizer
 */

import type { SupportedLanguage } from "@/lib/constants/language-config";
import type { SpeechOptions } from "./types";
import { getLanguageConfig } from "@/lib/constants/language-config";

/**
 * Speech Synthesizer class
 * Manages text-to-speech functionality
 */
export class SpeechSynthesizer {
  private speechAvailable: boolean | null = null;
  private elevenLabsAvailable: boolean | null = null;
  private defaultVolume = 0.6;
  private currentLanguage: SupportedLanguage = "en";
  private audioCache = new Map<string, ArrayBuffer>(); // Cache for ElevenLabs audio responses

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
   * Check if ElevenLabs API can be used
   */
  private canUseElevenLabs(): boolean {
    if (this.elevenLabsAvailable === null) {
      this.checkElevenLabsAvailability();
    }
    return this.elevenLabsAvailable === true;
  }

  /**
   * Check ElevenLabs API availability
   */
  private checkElevenLabsAvailability(): void {
    if (typeof window === "undefined") {
      this.elevenLabsAvailable = false;
      return;
    }

    try {
      const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY || import.meta.env.ELEVENLABS_API_KEY;
      if (!apiKey) {
        this.elevenLabsAvailable = false;
        if (import.meta.env.DEV) {
          console.log("[SpeechSynthesizer] ElevenLabs API key not found");
        }
        return;
      }

      // Test API connectivity with a simple request
      this.testElevenLabsConnection(apiKey).then(available => {
        this.elevenLabsAvailable = available;
        if (import.meta.env.DEV) {
          console.log(`[SpeechSynthesizer] ElevenLabs API ${available ? 'available' : 'unavailable'}`);
        }
      }).catch(() => {
        this.elevenLabsAvailable = false;
      });

      // Assume available initially
      this.elevenLabsAvailable = true;
    } catch {
      this.elevenLabsAvailable = false;
    }
  }

  /**
   * Test ElevenLabs API connection
   */
  private async testElevenLabsConnection(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'xi-api-key': apiKey,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
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
   * Speak text using ElevenLabs API (primary) or Web Speech API (fallback)
   * @returns true if speech started successfully
   */
  speak(
    text: string,
    options?: SpeechOptions & { langCode?: SupportedLanguage },
    cancelPrevious = false
  ): boolean {
    if (!text.trim()) return false;

    const _langCode = options?.langCode || this.currentLanguage;

    // Try ElevenLabs API first for better quality
    if (this.canUseElevenLabs()) {
      // Start ElevenLabs request asynchronously
      this.speakWithElevenLabs(text, options, cancelPrevious).catch(error => {
        console.warn("[SpeechSynthesizer] ElevenLabs failed, falling back to Web Speech:", error);
        // Fallback to Web Speech API
        this.speakWithWebSpeech(text, options, cancelPrevious);
      });
      return true;
    }

    // Fallback to Web Speech API
    return this.speakWithWebSpeech(text, options, cancelPrevious);
  }

  /**
   * Speak using ElevenLabs API
   */
  private async speakWithElevenLabs(
    text: string,
    options?: SpeechOptions & { langCode?: SupportedLanguage },
    _cancelPrevious = false
  ): Promise<void> {
    const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY || import.meta.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      throw new Error("ElevenLabs API key not available");
    }

    const _langCode = options?.langCode || this.currentLanguage;
    const config = getLanguageConfig(_langCode);
    const voiceId = config.elevenLabsVoiceId;

    // Check cache first
    const cacheKey = `${voiceId}-${text}-${options?.pitch || 1.0}-${options?.rate || 1.0}`;
    let audioBuffer = this.audioCache.get(cacheKey);

    if (!audioBuffer) {
      // Generate audio from ElevenLabs
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.8,
            style: 0.0,
            use_speaker_boost: true,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status}`);
      }

      audioBuffer = await response.arrayBuffer();
      this.audioCache.set(cacheKey, audioBuffer); // Cache for future use
    }

    // Play the audio
    if (typeof window !== "undefined" && window.AudioContext) {
      const audioContext = new AudioContext();
      const buffer = await audioContext.decodeAudioData(audioBuffer.slice(0));
      const source = audioContext.createBufferSource();
      const gainNode = audioContext.createGain();

      source.buffer = buffer;
      source.playbackRate.value = options?.rate ?? 1.0;
      gainNode.gain.value = options?.volume ?? this.defaultVolume;

      source.connect(gainNode);
      gainNode.connect(audioContext.destination);

      source.start();

      if (import.meta.env.DEV) {
        console.log(`[SpeechSynthesizer] Playing ElevenLabs audio (${langCode}): "${text}"`);
      }
    }
  }

  /**
   * Speak using Web Speech API (fallback)
   */
  private speakWithWebSpeech(
    text: string,
    options?: SpeechOptions & { langCode?: SupportedLanguage },
    cancelPrevious = false
  ): boolean {
    if (!this.canUseSpeech()) return false;

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
        console.log(`[SpeechSynthesizer] Speaking with Web Speech (${langCode}): "${text}"`);
      }

      return true;
    } catch (error) {
      console.warn("[SpeechSynthesizer] Failed to speak with Web Speech:", error);
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
      if (!text.trim()) {
        resolve(false);
        return;
      }

      const _langCode = options?.langCode || this.currentLanguage;

      // Try ElevenLabs API first
      if (this.canUseElevenLabs()) {
        this.speakWithElevenLabs(text, options).then(() => {
          resolve(true);
        }).catch((error) => {
          console.warn("[SpeechSynthesizer] ElevenLabs failed in async mode:", error);
          // Fall back to Web Speech API
          this.fallbackToWebSpeech(text, options, resolve);
        });
        return;
      }

      // Fallback to Web Speech API
      this.fallbackToWebSpeech(text, options, resolve);
    });
  }

  /**
   * Fallback to Web Speech API
   */
  private fallbackToWebSpeech(
    text: string,
    options?: SpeechOptions & { langCode?: SupportedLanguage },
    resolve: (value: boolean) => void
  ): void {
    if (!this.canUseSpeech()) {
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
  }

  /**
   * Set default volume for speech
   */
  setVolume(volume: number): void {
    this.defaultVolume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Check availability status (ElevenLabs preferred, Web Speech fallback)
   */
  isAvailable(): boolean | null {
    if (this.elevenLabsAvailable === true) return true;
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
