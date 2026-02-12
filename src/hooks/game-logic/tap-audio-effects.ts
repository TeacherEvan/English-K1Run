import { playSoundEffect, soundManager } from "../../lib/sound-manager";

/**
 * Plays audio feedback for object taps.
 */
export const playTapAudioFeedback = (isCorrect: boolean): void => {
  if (isCorrect) {
    void soundManager.playSound("success");
  } else {
    playSoundEffect.targetMiss();
  }
};
