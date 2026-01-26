/**
 * Word Playback Module
 *
 * Handles the word/phrase playback pipeline with sentence templates,
 * audio sprites, HTMLAudio, and speech synthesis fallbacks.
 *
 * @module audio/word-playback
 */

import type { SupportedLanguage } from "../constants/language-config";
import { getSentenceTemplate } from "../constants/sentence-templates";
import { eventTracker } from "../event-tracker";
import { describeIfEnabled } from "./audio-accessibility";
import { hasAudioKey } from "./audio-registry";
import { audioSpritePlayer } from "./audio-sprite";
import { SpeechPlayback } from "./speech-playback";

export interface WordPlaybackContext {
  ensureInitialized: () => Promise<void>;
  getAudioContext: () => AudioContext | null;
  getVolume: () => number;
  useAudioSprite: () => boolean;
  currentLanguage: () => SupportedLanguage;
  resolveCandidates: (name: string) => string[];
  playVoiceClip: (
    name: string,
    playbackRate?: number,
    maxDuration?: number,
    volumeOverride?: number,
  ) => Promise<boolean>;
  loadBufferForName: (
    name: string,
    allowFallback?: boolean,
  ) => Promise<AudioBuffer | null>;
  startBuffer: (
    buffer: AudioBuffer,
    delaySeconds?: number,
    soundKey?: string,
    playbackRate?: number,
    volumeOverride?: number,
  ) => void;
  speechPlayback: SpeechPlayback;
}

export async function playWordInternal(
  context: WordPlaybackContext,
  phrase: string,
  volumeOverride?: number,
  useSentenceTemplate = true,
  cancelPrevious = false,
): Promise<void> {
  if (!phrase) return;

  try {
    await context.ensureInitialized();

    const trimmed = phrase.trim();
    if (!trimmed) return;

    const startTime = performance.now();
    const normalizedPhrase = trimmed.toLowerCase();
    const volume = volumeOverride ?? context.getVolume();

    if (useSentenceTemplate) {
      const sentence = getSentenceTemplate(
        normalizedPhrase,
        context.currentLanguage(),
      );

      if (sentence) {
        if (import.meta.env.DEV) {
          console.log(
            `[WordPlayback] Using sentence template for "${trimmed}": "${sentence}"`,
          );
        }
        if (
          await context.speechPlayback.speakAsync(
            sentence,
            volume,
            cancelPrevious,
          )
        ) {
          const duration = performance.now() - startTime;
          eventTracker.trackAudioPlayback({
            audioKey: normalizedPhrase,
            targetName: trimmed,
            method: "speech-synthesis",
            success: true,
            duration,
          });
          return;
        }

        console.warn(
          "[WordPlayback] Speech synthesis failed for sentence, falling back",
        );
      }
    }

    if (context.useAudioSprite() && audioSpritePlayer.isConfigured()) {
      const candidates = context.resolveCandidates(trimmed);
      for (const candidate of candidates) {
        const played = await audioSpritePlayer.playClip(candidate, {
          playbackRate: 1.0,
          volume,
        });
        if (played) {
          const duration = performance.now() - startTime;
          eventTracker.trackAudioPlayback({
            audioKey: candidate,
            targetName: trimmed,
            method: "audio-sprite",
            success: true,
            duration,
          });
          return;
        }
      }
    }

    if (await context.playVoiceClip(trimmed, 1.0, undefined, volume)) {
      const duration = performance.now() - startTime;
      const candidates = context.resolveCandidates(trimmed);
      const successfulKey = candidates.find((c) => hasAudioKey(c)) || trimmed;
      eventTracker.trackAudioPlayback({
        audioKey: successfulKey,
        targetName: trimmed,
        method: "wav",
        success: true,
        duration,
      });
      return;
    }

    const parts = trimmed.split(/[\s-]+/).filter(Boolean);
    if (parts.length > 1) {
      if (
        await context.speechPlayback.speakAsync(trimmed, volume, cancelPrevious)
      ) {
        const duration = performance.now() - startTime;
        eventTracker.trackAudioPlayback({
          audioKey: trimmed,
          targetName: trimmed,
          method: "speech-synthesis",
          success: true,
          duration,
        });
        return;
      }

      let delay = 0;
      let anyPlayed = false;
      for (const part of parts) {
        const buffer = await context.loadBufferForName(part, false);
        if (buffer && context.getAudioContext()) {
          context.startBuffer(buffer, delay, undefined, 1.0, volume);
          delay += buffer.duration + 0.1;
          anyPlayed = true;
        }
      }

      if (anyPlayed) {
        const duration = performance.now() - startTime;
        eventTracker.trackAudioPlayback({
          audioKey: trimmed,
          targetName: trimmed,
          method: "wav",
          success: true,
          duration,
        });
        return;
      }
    } else {
      if (
        await context.speechPlayback.speakAsync(trimmed, volume, cancelPrevious)
      ) {
        const duration = performance.now() - startTime;
        eventTracker.trackAudioPlayback({
          audioKey: trimmed,
          targetName: trimmed,
          method: "speech-synthesis",
          success: true,
          duration,
        });
        return;
      }
    }

    describeIfEnabled(`Target: ${trimmed}`);
    eventTracker.trackAudioPlayback({
      audioKey: trimmed,
      targetName: trimmed,
      method: "fallback-tone",
      success: false,
      error: "no_audio_available",
    });
  } catch (error) {
    console.warn("[WordPlayback] Failed to play word audio:", error);
    eventTracker.trackAudioPlayback({
      audioKey: phrase,
      targetName: phrase,
      method: "fallback-tone",
      success: false,
      error: error instanceof Error ? error.message : "exception",
    });
  }
}
