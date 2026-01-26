/**
 * Audio Loader Module
 *
 * Unified re-export of modular audio loading components.
 * Refactored Jan 2026 to meet 500-line file limit.
 *
 * @module audio/audio-loader
 */

// Re-export from audio-registry
export {
  getAudioUrl,
  getRegisteredKeys,
  hasAudioKey,
  normalizeKey,
  resolveCandidates,
} from "./audio-registry";

// Re-export from audio-priorities
export { AUDIO_PRIORITIES } from "./audio-priorities";

// Re-export from audio-buffer-loader
export { AudioBufferLoader, audioBufferLoader } from "./audio-buffer-loader";
