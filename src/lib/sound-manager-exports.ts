/**
 * Convenience exports for sound manager consumers.
 */

import { soundManager } from "./sound-manager-core";

export const playSoundEffect = {
  voice: (phrase: string) => soundManager.playWord(phrase),
  sticker: () => {
    soundManager.playSpeech("GIVE THEM A STICKER!", { pitch: 1.2, rate: 1.1 });
  },
  welcome: async () => soundManager.playSound("welcome"),
  stopAll: () => soundManager.stopAllAudio(),
  targetMiss: () => soundManager.playSound("explosion"),
  /**
   * Play a sound effect by name.
   * Looks for files in /sounds/{name}.wav
   * @param name - Sound file name without extension
   * @param playbackRate - Optional playback rate (default 0.9)
   * @param volumeOverride - Optional volume override (0-1)
   */
  byName: async (
    name: string,
    playbackRate?: number,
    volumeOverride?: number,
  ) => soundManager.playSound(name, playbackRate, volumeOverride),
};

export const prefetchAudioKeys = (keys: string[]) =>
  soundManager.prefetchAudioKeys(keys);

export const getAudioDebugInfo = () => soundManager.getDebugInfo();
