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

// Tone generator utilities removed — audio-tone-generator deleted

// Speech synthesizer
export { SpeechSynthesizer, speechSynthesizer } from "./speech-synthesizer";

// Audio player
export { AudioPlayer, audioPlayer } from "./audio-player";

// Optional audio sprite + accessibility helpers
export {
  announceAudioDescription,
  describeIfEnabled,
  isAudioDescriptionsEnabled,
  setAudioDescriptionsEnabled,
} from "./audio-accessibility";
export { AudioSpritePlayer, audioSpritePlayer } from "./audio-sprite";
