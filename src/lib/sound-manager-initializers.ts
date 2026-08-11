/**
 * SoundManager dependency initializers.
 */

import type { SoundPlaybackEngine } from "./audio/sound-playback-engine";
import { SoundFadePlayback } from "./sound-manager-fade";
import {
  getAudioContext,
  getAudioUrlForKey,
  loadBufferForName,
  resolveAudioCandidates,
  startBuffer,
  startBufferAsync,
} from "./sound-manager/helpers";
import { createSoundPlayback } from "./sound-manager/playback";
import { createSpeechControls } from "./sound-manager/speech";

export interface PlaybackInitOptions {
  isEnabled: () => boolean;
  getVolume: () => number;
  ensureInitialized: () => Promise<void>;
  useAudioSprite: () => boolean;
  preferHTMLAudio: () => boolean;
  playbackEngine: SoundPlaybackEngine;
  trackPlaybackStart: (soundName: string) => void;
  trackPlaybackEnd: (soundName?: string) => void;
}

export const createManagerPlayback = (options: PlaybackInitOptions) =>
  createSoundPlayback({
    isEnabled: options.isEnabled,
    getAudioContext: () => getAudioContext(),
    getVolume: options.getVolume,
    ensureInitialized: options.ensureInitialized,
    useAudioSprite: options.useAudioSprite,
    preferHTMLAudio: options.preferHTMLAudio,
    resolveCandidates: (name) => resolveAudioCandidates(name),
    getUrl: (key) => getAudioUrlForKey(key),
    loadBufferForName: (name, allowFallback) =>
      loadBufferForName(name, allowFallback),
    startBufferAsync: (buffer, delaySeconds, soundKey, playbackRate, volume) =>
      startBufferAsync(
        options.playbackEngine,
        buffer,
        delaySeconds,
        soundKey,
        playbackRate,
        volume,
      ),
    playbackEngine: options.playbackEngine,
    trackPlaybackStart: options.trackPlaybackStart,
    trackPlaybackEnd: options.trackPlaybackEnd,
  });

export interface SpeechInitOptions {
  ensureInitialized: () => Promise<void>;
  getVolume: () => number;
  useAudioSprite: () => boolean;
  playbackEngine: SoundPlaybackEngine;
  playVoiceClip: (
    name: string,
    rate?: number,
    maxDuration?: number,
    volume?: number,
  ) => Promise<boolean>;
  stopAllAudio: () => void;
  isEnabled: () => boolean;
}

export const createManagerSpeechControls = (options: SpeechInitOptions) =>
  createSpeechControls({
    ensureInitialized: options.ensureInitialized,
    getAudioContext: () => getAudioContext(),
    getVolume: options.getVolume,
    useAudioSprite: options.useAudioSprite,
    resolveCandidates: (name) => resolveAudioCandidates(name),
    playVoiceClip: options.playVoiceClip,
    loadBufferForName: (name, allowFallback) =>
      loadBufferForName(name, allowFallback),
    startBuffer: (buffer, delaySeconds, soundKey, rate, volume) =>
      startBuffer(
        options.playbackEngine,
        buffer,
        delaySeconds,
        soundKey,
        rate,
        volume,
      ),
    stopAllAudio: options.stopAllAudio,
    isEnabled: options.isEnabled,
  });

export interface FadePlaybackInitOptions {
  isEnabled: () => boolean;
  ensureInitialized: () => Promise<void>;
  getAudioContext: () => AudioContext | null;
  playbackEngine: SoundPlaybackEngine;
  playSound: (
    soundName: string,
    playbackRate?: number,
    volumeOverride?: number,
  ) => Promise<void>;
  trackPlaybackStart: (soundName: string) => void;
  trackPlaybackEnd: (soundName?: string) => void;
}

export const createManagerFadePlayback = (options: FadePlaybackInitOptions) =>
  new SoundFadePlayback({
    isEnabled: options.isEnabled,
    ensureInitialized: options.ensureInitialized,
    getAudioContext: options.getAudioContext,
    loadBufferForName: (name, allowFallback) =>
      loadBufferForName(name, allowFallback),
    playSound: options.playSound,
    startBufferWithFadeIn: (buffer, delaySeconds, soundKey, rate, vol, fadeMs) =>
      options.playbackEngine.startBufferWithFadeIn(
        buffer,
        delaySeconds,
        soundKey,
        rate,
        vol,
        fadeMs,
      ),
    startBufferWithFadeInAsync: (
      buffer,
      delaySeconds,
      soundKey,
      rate,
      vol,
      fadeMs,
    ) =>
      options.playbackEngine.startBufferWithFadeInAsync(
        buffer,
        delaySeconds,
        soundKey,
        rate,
        vol,
        fadeMs,
      ),
    trackPlaybackStart: options.trackPlaybackStart,
    trackPlaybackEnd: options.trackPlaybackEnd,
  });
