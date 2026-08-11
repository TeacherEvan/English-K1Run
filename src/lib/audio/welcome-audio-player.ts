/**
 * Welcome audio player - handles playback of audio sequences.
 */

import { getAudioUrl } from "./audio-registry";
import { centralAudioManager } from "./central-audio-manager";
import { speechSynthesizer } from "./speech-synthesizer";
import {
  DEFAULT_WELCOME_CONFIG,
  type AudioAssetMetadata,
  type WelcomeAudioConfig,
  type WelcomePlaybackDiagnostic,
} from "./welcome-audio-types";

const shouldUseNativeThaiSpeech = (asset: AudioAssetMetadata): boolean =>
  asset.language === "th" && Boolean(asset.fallbackText);

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
  onDiagnostic?: (diagnostic: WelcomePlaybackDiagnostic) => void,
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
      let speechPlayed = false;
      try {
        if (shouldUseNativeThaiSpeech(asset) && asset.fallbackText) {
          if (import.meta.env.DEV) {
            console.info(
              `[WelcomeAudioSequencer] Using native Thai speech for ${asset.key} to match gameplay voice playback.`,
            );
          }
          speechPlayed = await speechSynthesizer.speakAsync(
            asset.fallbackText,
            {
              langCode: "th",
            },
          );
          if (!speechPlayed) {
            console.warn(
              `[WelcomeAudioSequencer] Skipping prerecorded Thai welcome clip for ${asset.key} because native Thai speech was unavailable.`,
            );
            onDiagnostic?.({
              type: "thai-voice-unavailable",
              assetKey: asset.key,
              language: "th",
              fallbackMode: "silent",
            });
          }
        } else {
          const audioUrl = await getAudioUrl(asset.key);
          if (import.meta.env.DEV) {
            console.log(
              `[WelcomeAudioSequencer] Got URL for ${asset.key}: ${audioUrl}`,
            );
          }
          if (audioUrl) {
            audioPlayed = await centralAudioManager.playManaged({
              key: asset.key,
              channel: "welcome",
              priority: 100,
              playbackRate: 1,
              volume: 1,
              fadeInMs: 120,
              // Add buffer to expectedDurationMs to account for timing variations
              expectedDurationMs: Math.max(
                300,
                Math.round(asset.duration * 1000) + 200,
              ),
            });
            // Add extra delay after audio playback to ensure no overlap
            if (audioPlayed && i < assets.length - 1) {
              await new Promise((resolve) => setTimeout(resolve, 100));
            }
          } else {
            console.warn(
              `[WelcomeAudioSequencer] No URL available for ${asset.key}`,
            );
          }
        }
      } catch (err) {
        console.warn(
          `[WelcomeAudioSequencer] Failed to play audio for ${asset.key}:`,
          err,
        );
      }

      if (
        !speechPlayed &&
        !audioPlayed &&
        asset.fallbackText &&
        state.isPlaying &&
        !shouldUseNativeThaiSpeech(asset)
      ) {
        if (import.meta.env.DEV) {
          console.log(
            `[WelcomeAudioSequencer] Using speech fallback for ${asset.key}: "${asset.fallbackText}"`,
          );
        }
        try {
          const langCode = asset.language ?? "en";
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
    centralAudioManager.stopChannel("welcome");
    state.isPlaying = false;
  }
}
