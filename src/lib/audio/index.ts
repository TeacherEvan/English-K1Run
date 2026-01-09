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

// Audio loader
export {
  AUDIO_PRIORITIES,
  AudioBufferLoader,
  audioBufferLoader,
  getAudioUrl,
  getRegisteredKeys,
  hasAudioKey,
  normalizeKey,
  resolveCandidates,
} from "./audio-loader";

// Speech synthesizer
export { SpeechSynthesizer, speechSynthesizer } from "./speech-synthesizer";

// Audio player
export { AudioPlayer, audioPlayer } from "./audio-player";
