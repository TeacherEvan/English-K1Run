/**
 * Welcome audio player - handles playback of audio sequences.
 */

import { soundManager } from "../sound-manager";
import { getAudioUrl } from "./audio-registry";
import { speechSynthesizer } from "./speech-synthesizer";
import {
  DEFAULT_WELCOME_CONFIG,
  type AudioAssetMetadata,
  type WelcomeAudioConfig,
} from "./welcome-audio-types";

interface PlaybackState {
  isPlaying: boolean;
  currentProgress: { current: number; total: number };
}

export async function playAudioSequence(
  assets: AudioAssetMetadata[],
  config: Partial<WelcomeAudioConfig>,
  state: PlaybackState,
  onProgress?: (
    current: number,
    total: number,
    asset: AudioAssetMetadata,
  ) => void,
): Promise<void> {
  const fullConfig = { ...DEFAULT_WELCOME_CONFIG, ...config };

  try {
    for (let i = 0; i < assets.length; i++) {
      if (!state.isPlaying) break;

      const asset = assets[i];
      state.currentProgress.current = i + 1;
      onProgress?.(i + 1, assets.length, asset);

      if (import.meta.env.DEV) {
        console.log(
          `[WelcomeAudioSequencer] Playing ${i + 1}/${assets.length}: ${asset.key}`,
        );
      }

      let audioPlayed = false;
      try {
        const audioUrl = await getAudioUrl(asset.key);
        if (audioUrl) {
          await soundManager.playSound(asset.key, 1.0, 1.0);
          audioPlayed = true;
        }
      } catch (err) {
        console.warn(
          `[WelcomeAudioSequencer] Failed to play audio for ${asset.key}:`,
          err,
        );
      }

      if (!audioPlayed && asset.fallbackText && state.isPlaying) {
        if (import.meta.env.DEV) {
          console.log(
            `[WelcomeAudioSequencer] Using speech fallback for ${asset.key}: "${asset.fallbackText}"`,
          );
        }
        try {
          const langCode = asset.key.includes("_thai") ? "th" : "en";
          await speechSynthesizer.speakAsync(asset.fallbackText, {
            langCode,
          });
        } catch (speechErr) {
          console.warn(
            `[WelcomeAudioSequencer] Speech fallback also failed for ${asset.key}:`,
            speechErr,
          );
        }
      }

      if (i < assets.length - 1 && fullConfig.sequentialDelayMs > 0) {
        await new Promise((resolve) =>
          setTimeout(resolve, fullConfig.sequentialDelayMs),
        );
      }
    }
  } finally {
    state.isPlaying = false;
  }
}
