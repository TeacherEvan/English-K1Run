/**
 * ElevenLabs API Client
 *
 * Handles all communication with the ElevenLabs text-to-speech API.
 *
 * @module audio/speech/elevenlabs-client
 */

import type { SupportedLanguage } from "@/lib/constants/language-config";
import { getLanguageConfig } from "@/lib/constants/language-config";

/** Voice settings optimized for clear child-friendly pronunciation */
const DEFAULT_VOICE_SETTINGS = {
  stability: 0.35,
  similarity_boost: 0.9,
  style: 0.1,
  use_speaker_boost: true,
};

/** Softer voice settings for welcome messages */
const SOFT_VOICE_SETTINGS = {
  stability: 0.3,
  similarity_boost: 0.85,
  style: 0.05,
  use_speaker_boost: true,
};

export interface ElevenLabsOptions {
  text: string;
  voiceId?: string;
  languageCode?: SupportedLanguage;
  useSoftSettings?: boolean;
  rate?: number;
  pitch?: number;
  volume?: number;
}

/**
 * Get API key from environment
 */
function getApiKey(): string | null {
  if (typeof window === "undefined") return null;
  return (
    import.meta.env.VITE_ELEVENLABS_API_KEY ||
    import.meta.env.ELEVENLABS_API_KEY ||
    null
  );
}

/**
 * Get voice ID for a specific language
 */
function getVoiceId(langCode: SupportedLanguage): string {
  const config = getLanguageConfig(langCode);
  return config.elevenLabsVoiceId;
}

/**
 * Test ElevenLabs API connectivity
 */
export async function testElevenLabsConnection(): Promise<boolean> {
  const apiKey = getApiKey();
  if (!apiKey) return false;

  try {
    const response = await fetch("https://api.elevenlabs.io/v1/voices", {
      method: "GET",
      headers: {
        Accept: "application/json",
        "xi-api-key": apiKey,
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Generate audio using ElevenLabs API
 */
export async function generateSpeech(
  options: ElevenLabsOptions,
): Promise<ArrayBuffer | null> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("ElevenLabs API key not available");
  }

  const voiceId = options.voiceId || getVoiceId(options.languageCode || "en");
  const settings = options.useSoftSettings
    ? SOFT_VOICE_SETTINGS
    : DEFAULT_VOICE_SETTINGS;

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        Accept: "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({
        text: options.text,
        model_id: "eleven_multilingual_v2",
        voice_settings: settings,
        language_code: options.languageCode || "en",
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`ElevenLabs API error: ${response.status}`);
  }

  return await response.arrayBuffer();
}

/**
 * Play ArrayBuffer audio through Web Audio API
 */
export async function playAudioBuffer(
  audioData: ArrayBuffer,
  options?: { rate?: number; volume?: number },
): Promise<void> {
  if (typeof window === "undefined" || !window.AudioContext) {
    throw new Error("Web Audio API not available");
  }

  const audioContext = new AudioContext();
  const buffer = await audioContext.decodeAudioData(audioData.slice(0));
  const source = audioContext.createBufferSource();
  const gainNode = audioContext.createGain();

  source.buffer = buffer;
  source.playbackRate.value = options?.rate ?? 1.0;
  gainNode.gain.value = options?.volume ?? 0.6;

  source.connect(gainNode);
  gainNode.connect(audioContext.destination);

  source.start();
}
