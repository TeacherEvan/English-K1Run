import { playSoundEffect } from "../../lib/sound-manager";

/** Pitch lift per consecutive correct tap, capped so it never turns shrill. */
const COMBO_PITCH_STEP = 0.03;
const COMBO_PITCH_CAP_TAPS = 10;

/**
 * Plays non-verbal feedback for object taps.
 *
 * Correct taps rise in pitch as the streak builds (1.00 -> 1.30), which is the
 * classic "you are on a roll" cue for pre-readers: the reward is audible even
 * when the HUD is not being watched. Wrong taps drop in pitch instead.
 */
export const playTapAudioFeedback = (
  isCorrect: boolean,
  streak = 0,
): void => {
  if (!isCorrect) {
    void playSoundEffect.byName("wrong", 0.8);
    return;
  }

  // `streak` is the count already banked BEFORE this tap: 0 -> unity pitch,
  // then one step per banked success, capped.
  const comboSteps = Math.min(Math.max(streak, 0), COMBO_PITCH_CAP_TAPS);
  const playbackRate = 1 + comboSteps * COMBO_PITCH_STEP;

  void playSoundEffect.byName("success", playbackRate);
};
