import { playSoundEffect } from "../../lib/sound-manager-exports";

/**
 * Plays audio feedback for object taps.
 * @param isCorrect - Whether the tap was on the correct target
 */
export const playTapAudioFeedback = (isCorrect: boolean): void => {
  const soundName = isCorrect ? "success" : "wrong";
  const playbackRate = isCorrect ? 1.0 : 0.9;

  // Fire-and-forget with void operator - errors handled by sound manager
  void playSoundEffect.byName(soundName, playbackRate, 0.7);
};
