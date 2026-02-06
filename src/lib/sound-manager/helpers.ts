/**
 * Thin wrappers around audio module helpers.
 */

import { audioBufferLoader } from "../audio/audio-buffer-loader";
import { audioContextManager } from "../audio/audio-context-manager";
import { getAudioUrl, resolveCandidates } from "../audio/audio-registry";
import type { SoundPlaybackEngine } from "../audio/sound-playback-engine";

export const getAudioContext = (): AudioContext | null =>
  audioContextManager.getContext();

export const resolveAudioCandidates = (name: string): string[] =>
  resolveCandidates(name);

export const getAudioUrlForKey = (key: string): Promise<string | null> =>
  getAudioUrl(key);

export const loadBufferForName = (
  name: string,
  allowFallback = true,
): Promise<AudioBuffer | null> =>
  audioBufferLoader.loadBufferForName(name, allowFallback);

export const startBuffer = (
  playbackEngine: SoundPlaybackEngine,
  buffer: AudioBuffer,
  delaySeconds = 0,
  soundKey?: string,
  playbackRate = 1.0,
  volumeOverride?: number,
) =>
  playbackEngine.startBuffer(
    buffer,
    delaySeconds,
    soundKey,
    playbackRate,
    volumeOverride,
  );

export const startBufferAsync = (
  playbackEngine: SoundPlaybackEngine,
  buffer: AudioBuffer,
  delaySeconds = 0,
  soundKey?: string,
  playbackRate = 1.0,
  volumeOverride?: number,
): Promise<void> =>
  playbackEngine.startBufferAsync(
    buffer,
    delaySeconds,
    soundKey,
    playbackRate,
    volumeOverride,
  );
