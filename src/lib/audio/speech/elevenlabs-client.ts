/**
 * ElevenLabs API Client
 *
 * Handles all communication with the ElevenLabs text-to-speech API.
 *
 * @module audio/speech/elevenlabs-client
 */

import { audioContextManager } from "@/lib/audio/audio-context-manager";
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

const AUDIO_PLAYBACK_STATE_KEY = "__k1_audio_playback_state__";

type PlaybackState = {
  context: AudioContext | null;
  activeSource: AudioBufferSourceNode | null;
};

const getPlaybackState = (): PlaybackState => {
  const globalScope = globalThis as typeof globalThis & {
    [AUDIO_PLAYBACK_STATE_KEY]?: PlaybackState;
  };

  if (!globalScope[AUDIO_PLAYBACK_STATE_KEY]) {
    globalScope[AUDIO_PLAYBACK_STATE_KEY] = {
      context: null,
      activeSource: null,
    };
  }

  return globalScope[AUDIO_PLAYBACK_STATE_KEY]!;
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
  const apiKey =
    import.meta.env.VITE_ELEVENLABS_API_KEY ||
    import.meta.env.ELEVENLABS_API_KEY ||
    null;

  if (!apiKey && import.meta.env.DEV) {
    console.warn(
      "[ElevenLabs] API key not configured. Set VITE_ELEVENLABS_API_KEY in .env file.\n" +
        "Audio will fall back to Web Speech API (robotic voice).\n" +
        "See .env.example for configuration details.",
    );
  }

  return apiKey;
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
  if (!apiKey) {
    if (import.meta.env.DEV) {
      console.info(
        "[ElevenLabs] Skipping connection test - no API key configured",
      );
    }
    return false;
  }

  try {
    const response = await fetch("https://api.elevenlabs.io/v1/voices", {
      method: "GET",
      headers: {
        Accept: "application/json",
        "xi-api-key": apiKey,
      },
    });

    if (response.ok) {
      if (import.meta.env.DEV) {
        console.info("[ElevenLabs] API connection successful ✓");
      }
      return true;
    } else {
      if (import.meta.env.DEV) {
        console.warn(
          `[ElevenLabs] API connection failed with status ${response.status}.\n` +
            "Please check your API key validity at https://elevenlabs.io",
        );
      }
      return false;
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn(
        "[ElevenLabs] API connection error:",
        error instanceof Error ? error.message : String(error),
      );
    }
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

  const playbackState = getPlaybackState();

  if (!playbackState.context || playbackState.context.state === "closed") {
    const managedContext = audioContextManager.getContext();
    playbackState.context = managedContext ?? new AudioContext();
  }

  if (playbackState.context.state === "suspended") {
    await playbackState.context.resume();
  }

  if (playbackState.activeSource) {
    try {
      playbackState.activeSource.stop();
    } catch {
      // ignore stop errors
    }
    playbackState.activeSource = null;
  }

  const buffer = await playbackState.context.decodeAudioData(
    audioData.slice(0),
  );
  const source = playbackState.context.createBufferSource();
  const gainNode = playbackState.context.createGain();

  source.buffer = buffer;
  source.playbackRate.value = options?.rate ?? 1.0;
  gainNode.gain.value = options?.volume ?? 0.6;

  source.connect(gainNode);
  gainNode.connect(playbackState.context.destination);

  playbackState.activeSource = source;
  source.onended = () => {
    if (playbackState.activeSource === source) {
      playbackState.activeSource = null;
    }
  };

  source.start();
}

export function stopAudioBufferPlayback(): void {
  const playbackState = getPlaybackState();
  if (!playbackState.activeSource) return;
  try {
    playbackState.activeSource.stop();
  } catch {
    // ignore stop errors
  }
  playbackState.activeSource = null;
}
