/**
 * Web Speech API Client
 *
 * Handles text-to-speech using the browser's built-in Web Speech API.
 *
 * @module audio/speech/web-speech-client
 */

import type { SupportedLanguage } from "@/lib/constants/language-config";

export interface WebSpeechOptions {
  text: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  langCode?: SupportedLanguage;
  cancelPrevious?: boolean;
}

/** Map language codes to speech synthesis language prefixes */
const LANG_PREFIX_MAP: Record<SupportedLanguage, string[]> = {
  en: ["en"],
  fr: ["fr"],
  ja: ["ja"],
  th: ["th"],
  "zh-CN": ["zh-CN", "zh"],
  "zh-HK": ["zh-HK", "zh"],
};

/**
 * Check if Web Speech API is available
 */
export function isWebSpeechAvailable(): boolean {
  if (typeof window === "undefined") return false;
  return "speechSynthesis" in window && !!window.speechSynthesis;
}

/**
 * Get all available voices
 */
export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (!isWebSpeechAvailable()) return [];
  return window.speechSynthesis?.getVoices() ?? [];
}

/**
 * Get preferred voice for a specific language
 */
export function getPreferredVoice(
  langCode: SupportedLanguage,
): SpeechSynthesisVoice | null {
  const voices = getAvailableVoices();
  if (voices.length === 0) return null;

  const langPrefixes = LANG_PREFIX_MAP[langCode];
  if (!langPrefixes) return voices[0];

  // Filter voices by language
  const langVoices = voices.filter((v) =>
    langPrefixes.some((prefix) => v.lang.startsWith(prefix)),
  );

  if (langVoices.length > 0) {
    return langVoices[0];
  }

  // Fallback to base language
  const basePrefix = langPrefixes[0]?.substring(0, 2);
  if (basePrefix) {
    const baseVoices = voices.filter((v) => v.lang.startsWith(basePrefix));
    if (baseVoices.length > 0) return baseVoices[0];
  }

  return voices[0];
}

/**
 * Stop all ongoing speech
 */
export function stopSpeech(): void {
  if (!isWebSpeechAvailable()) return;
  try {
    window.speechSynthesis?.cancel();
  } catch {
    // Ignore errors
  }
}

/**
 * Speak text using Web Speech API
 */
export function speak(options: WebSpeechOptions): boolean {
  if (!isWebSpeechAvailable()) return false;

  const text = options.text?.trim();
  if (!text) return false;

  try {
    const synth = window.speechSynthesis;
    if (!synth) return false;

    if (options.cancelPrevious) {
      synth.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const langCode = options.langCode || "en";

    utterance.rate = options.rate ?? 1.0;
    utterance.pitch = options.pitch ?? 1.0;
    utterance.volume = options.volume ?? 0.6;

    const voice = getPreferredVoice(langCode);
    if (voice) {
      utterance.voice = voice;
    }

    synth.speak(utterance);
    return true;
  } catch {
    return false;
  }
}

/**
 * Speak text with promise that resolves when done
 */
export function speakAsync(options: WebSpeechOptions): Promise<boolean> {
  return new Promise((resolve) => {
    if (!isWebSpeechAvailable()) {
      resolve(false);
      return;
    }

    const text = options.text?.trim();
    if (!text) {
      resolve(false);
      return;
    }

    try {
      const synth = window.speechSynthesis;
      if (!synth) {
        resolve(false);
        return;
      }

      if (options.cancelPrevious) {
        synth.cancel();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      const langCode = options.langCode || "en";

      utterance.rate = options.rate ?? 1.0;
      utterance.pitch = options.pitch ?? 1.0;
      utterance.volume = options.volume ?? 0.6;

      const voice = getPreferredVoice(langCode);
      if (voice) {
        utterance.voice = voice;
      }

      let resolved = false;
      const cleanup = () => {
        resolved = true;
      };

      utterance.onend = () => {
        if (resolved) return;
        cleanup();
        resolve(true);
      };

      utterance.onerror = () => {
        if (resolved) return;
        cleanup();
        resolve(false);
      };

      synth.speak(utterance);

      // Safety timeout
      setTimeout(() => {
        if (!resolved) {
          cleanup();
          synth.cancel();
          resolve(false);
        }
      }, 10000);
    } catch {
      resolve(false);
    }
  });
}
