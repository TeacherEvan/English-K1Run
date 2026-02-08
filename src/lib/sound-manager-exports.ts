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
};

export const prefetchAudioKeys = (keys: string[]) =>
  soundManager.prefetchAudioKeys(keys);

export const getAudioDebugInfo = () => soundManager.getDebugInfo();
