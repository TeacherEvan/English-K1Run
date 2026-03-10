import { soundManager } from "../../lib/sound-manager";

/**
 * Plays audio feedback for object taps.
 * @param isCorrect - Whether the tap was on the correct target
 */
export const playTapAudioFeedback = (isCorrect: boolean): void => {
  // positive reinforcement audio has been removed per updated design;
  // only play a sound when the tap is incorrect so children aren't distracted
  if (!isCorrect) {
    void soundManager.playSound("wrong", 0.9, 0.7);
  }
};
