/**
 * Audio System Index
 *
 * Re-exports all audio modules for convenient importing.
 * This is the main entry point for the modular audio system.
 *
 * @module audio
 */

// Types
export * from "./types";

// Audio context management
export {
  AudioContextManager,
  audioContextManager,
} from "./audio-context-manager";

// Audio preloader
export { AudioPreloader, audioPreloader } from "./audio-preloader";

// Audio registry (file discovery and indexing)
export {
  getAudioUrl,
  getRegisteredKeys,
  hasAudioKey,
  normalizeKey,
  resolveCandidates,
} from "./audio-registry";

// Audio priorities
export { AUDIO_PRIORITIES } from "./audio-priorities";

// Audio buffer loader
export { AudioBufferLoader, audioBufferLoader } from "./audio-buffer-loader";

// Speech synthesizer
export { SpeechSynthesizer, speechSynthesizer } from "./speech-synthesizer";

// Optional audio sprite + accessibility helpers
export {
  announceAudioDescription,
  describeIfEnabled,
  isAudioDescriptionsEnabled,
  setAudioDescriptionsEnabled,
} from "./audio-accessibility";
export { AudioSpritePlayer, audioSpritePlayer } from "./audio-sprite";

// Welcome audio sequencer
export {
  clearActiveTargetEmojis,
  DEFAULT_WELCOME_CONFIG,
  getActiveTargetEmojis,
  getWelcomeAudioSequence,
  getWelcomeSequenceProgress,
  isWelcomeSequencePlaying,
  playWelcomeSequence,
  preloadWelcomeAudio,
  setActiveTargetEmojis,
  stopWelcomeSequence,
  WELCOME_AUDIO_ASSETS,
} from "./welcome-audio-sequencer";
export type {
  AudioAssetMetadata,
  WelcomeAudioConfig,
} from "./welcome-audio-sequencer";

// Target announcements + phonics
export { getTargetSentence, playTargetSentence } from "./target-announcements";
export { playTargetPhonics } from "./phonics";
