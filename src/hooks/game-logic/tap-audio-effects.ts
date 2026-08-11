import { playSoundEffect } from "../../lib/sound-manager";

/**
 * Plays non-verbal feedback for object taps.
 */
export const playTapAudioFeedback = (isCorrect: boolean): void => {
  const soundName = isCorrect ? "success" : "wrong";
  const playbackRate = isCorrect ? 1 : 0.8;

  void playSoundEffect.byName(soundName, playbackRate);
};
