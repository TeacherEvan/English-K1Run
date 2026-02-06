/**
 * Speech synthesis and word playback helpers.
 */

import { SpeechPlayback } from "../audio/speech-playback";
import { speechSynthesizer } from "../audio/speech-synthesizer";
import { playWordInternal } from "../audio/word-playback";
import type { SupportedLanguage } from "../constants/language-config";
import { getLanguageConfig } from "../constants/language-config";

export interface SpeechControlsDependencies {
  ensureInitialized: () => Promise<void>;
  getAudioContext: () => AudioContext | null;
  getVolume: () => number;
  useAudioSprite: () => boolean;
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
  stopAllAudio: () => void;
  isEnabled: () => boolean;
}

export const createSpeechControls = (deps: SpeechControlsDependencies) => {
  const speechPlayback = new SpeechPlayback();
  let currentLanguage: SupportedLanguage = "en";

  const playWord = (phrase: string, volumeOverride?: number) => {
    deps.stopAllAudio();
    speechPlayback.resetQueue();
    return speechPlayback.enqueue(() =>
      playWordInternal(
        {
          ensureInitialized: deps.ensureInitialized,
          getAudioContext: deps.getAudioContext,
          getVolume: deps.getVolume,
          useAudioSprite: deps.useAudioSprite,
          currentLanguage: () => currentLanguage,
          resolveCandidates: deps.resolveCandidates,
          playVoiceClip: deps.playVoiceClip,
          loadBufferForName: deps.loadBufferForName,
          startBuffer: deps.startBuffer,
          speechPlayback,
        },
        phrase,
        volumeOverride,
        true,
        true,
      ),
    );
  };

  const playSpeech = async (
    text: string,
    options?: { pitch?: number; rate?: number; volume?: number },
  ) => {
    if (!deps.isEnabled() || !text) return;
    return speechPlayback.enqueue(async () => {
      try {
        if (!speechPlayback.canUseSpeech()) return;
        const synth = window.speechSynthesis;
        if (!synth) return;
        await new Promise<void>((resolve) => {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.pitch = options?.pitch ?? 1.0;
          utterance.rate = options?.rate ?? 1.0;
          utterance.volume = options?.volume ?? deps.getVolume();
          utterance.onend = () => resolve();
          utterance.onerror = () => resolve();
          synth.speak(utterance);
        });
      } catch (error) {
        console.error("[SoundManager] Custom speech synthesis error:", error);
      }
    });
  };

  const setLanguage = (langCode: SupportedLanguage) => {
    if (currentLanguage === langCode) return;
    currentLanguage = langCode;
    try {
      speechSynthesizer.setLanguage(langCode);
    } catch {
      /* silent */
    }
  };

  const getLanguage = () => currentLanguage;

  const getLanguageVoiceId = () => {
    const config = getLanguageConfig(currentLanguage);
    return config.elevenLabsVoiceId;
  };

  return {
    speechPlayback,
    playWord,
    playSpeech,
    setLanguage,
    getLanguage,
    getLanguageVoiceId,
  };
};
