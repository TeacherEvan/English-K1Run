/**
 * Welcome Audio Sequencer
 *
 * Public entry for welcome audio sequencing.
 *
 * @module audio/welcome-audio-sequencer
 */

export { WELCOME_AUDIO_ASSETS } from "./welcome-audio-assets";
export {
  clearActiveTargetEmojis,
  getActiveTargetEmojis,
  getWelcomeAudioSequence,
  getWelcomeSequenceProgress,
  isWelcomeSequencePlaying,
  playWelcomeSequence,
  preloadWelcomeAudio,
  setActiveTargetEmojis,
  stopWelcomeSequence,
  welcomeAudioSequencer,
} from "./welcome-audio-helpers";
export { WelcomeAudioSequencer } from "./welcome-audio-sequencer-core";
export {
  DEFAULT_WELCOME_CONFIG,
  PRIMARY_WELCOME_AUDIO_KEY,
} from "./welcome-audio-types";
export type {
  AudioAssetMetadata,
  WelcomeAudioConfig,
} from "./welcome-audio-types";
