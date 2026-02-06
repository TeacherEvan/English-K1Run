/**
 * Shared playback handlers for sound effects and voice clips.
 */

import { describeIfEnabled } from "../audio/audio-accessibility";
import { audioSpritePlayer } from "../audio/audio-sprite";
import { SoundPlaybackEngine } from "../audio/sound-playback-engine";

export interface SoundPlaybackDependencies {
  isEnabled: () => boolean;
  getAudioContext: () => AudioContext | null;
  getVolume: () => number;
  ensureInitialized: () => Promise<void>;
  useAudioSprite: () => boolean;
  preferHTMLAudio: () => boolean;
  resolveCandidates: (name: string) => string[];
  getUrl: (key: string) => Promise<string | null>;
  loadBufferForName: (
    name: string,
    allowFallback?: boolean,
  ) => Promise<AudioBuffer | null>;
  startBufferAsync: (
    buffer: AudioBuffer,
    delaySeconds: number,
    soundKey?: string,
    playbackRate?: number,
    volumeOverride?: number,
  ) => Promise<void>;
  playbackEngine: SoundPlaybackEngine;
  trackPlaybackStart: (soundName: string) => void;
  trackPlaybackEnd: (soundName?: string) => void;
}

export const createSoundPlayback = (deps: SoundPlaybackDependencies) => {
  const playVoiceClip = async (
    name: string,
    playbackRate = 1.0,
    maxDuration?: number,
    volumeOverride?: number,
  ): Promise<boolean> => {
    const candidates = deps.resolveCandidates(name);

    for (const candidate of candidates) {
      const url = await deps.getUrl(candidate);
      if (!url) continue;
      const played = await deps.playbackEngine.playWithHtmlAudio(
        candidate,
        url,
        playbackRate,
        maxDuration,
        volumeOverride,
      );
      if (played) {
        return true;
      }
    }

    return false;
  };

  const playSound = async (
    soundName: string,
    playbackRate = 0.9,
    volumeOverride?: number,
  ): Promise<void> => {
    if (!deps.isEnabled()) return;
    deps.trackPlaybackStart(soundName);
    try {
      if (deps.useAudioSprite() && audioSpritePlayer.isConfigured()) {
        const candidates = deps.resolveCandidates(soundName);
        for (const candidate of candidates) {
          const played = await audioSpritePlayer.playClip(candidate, {
            playbackRate,
            volume: volumeOverride ?? deps.getVolume(),
          });
          if (played) return;
        }
      }
      if (deps.preferHTMLAudio()) {
        const candidates = deps.resolveCandidates(soundName);
        for (const candidate of candidates) {
          const url = await deps.getUrl(candidate);
          if (!url) continue;
          const played = await deps.playbackEngine.playWithHtmlAudio(
            candidate,
            url,
            playbackRate,
            undefined,
            volumeOverride,
          );
          if (played) return;
        }
      }
      await deps.ensureInitialized();
      if (!deps.getAudioContext()) return;
      const buffer = await deps.loadBufferForName(soundName);
      if (!buffer) {
        describeIfEnabled(`Sound: ${soundName}`);
        return;
      }
      await deps.startBufferAsync(
        buffer,
        0,
        soundName,
        playbackRate,
        volumeOverride,
      );
    } catch (error) {
      console.error("[SoundManager] Failed to play sound:", error);
      describeIfEnabled(`Sound failed: ${soundName}`);
    } finally {
      deps.trackPlaybackEnd(soundName);
    }
  };

  return { playSound, playVoiceClip };
};
