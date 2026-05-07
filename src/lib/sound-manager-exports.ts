/**
 * Convenience exports for sound manager consumers.
 */

import { soundManager } from "./sound-manager-core";

export const playSoundEffect = {
  voice: (phrase: string) => soundManager.playWord(phrase),
  welcome: async () => soundManager.playSound("welcome"),
  stopAll: () => soundManager.stopAllAudio(),
  targetMiss: () => soundManager.playSound("explosion"),
  byName: (name: string, playbackRate = 0.9) =>
    soundManager.playSound(name, playbackRate),
};

export const prefetchAudioKeys = (keys: string[]) =>
  soundManager.prefetchAudioKeys(keys);

export const getAudioDebugInfo = () => soundManager.getDebugInfo();
