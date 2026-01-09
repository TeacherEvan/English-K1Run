/**
 * Audio System Types
 *
 * Shared type definitions for the modular audio system.
 * Part of the sound-manager.ts refactoring (Jan 2026).
 *
 * @module audio/types
 */

/** Audio priority levels for progressive loading */
export enum AudioPriority {
  /** Welcome screen, essential UI sounds - loaded immediately */
  CRITICAL = 0,
  /** Numbers 1-10, common letters, basic words - loaded on first interaction */
  COMMON = 1,
  /** Weather, vehicles, complex words, special effects - loaded on demand */
  RARE = 2,
}

/** Audio playback method tracking */
export type AudioMethod =
  | "wav"
  | "html-audio"
  | "speech-synthesis"
  | "fallback-tone"
  | "web-audio";

/** Result of an audio playback attempt */
export interface AudioPlaybackResult {
  success: boolean;
  method: AudioMethod;
  duration?: number;
  error?: string;
}

/** Configuration for audio playback */
export interface AudioPlaybackOptions {
  /** Playback rate (1.0 = normal speed) */
  playbackRate?: number;
  /** Maximum duration in ms before force-stopping */
  maxDuration?: number;
  /** Override default volume (0.0 - 1.0) */
  volume?: number;
  /** Whether to use sentence templates for educational context */
  useSentenceTemplate?: boolean;
  /** Whether to cancel any ongoing speech synthesis */
  cancelPrevious?: boolean;
}

/** Configuration for speech synthesis */
export interface SpeechOptions {
  pitch?: number;
  rate?: number;
  volume?: number;
}

/** Audio buffer loading state */
export interface AudioLoadState {
  isLoading: boolean;
  isLoaded: boolean;
  error?: string;
}

/** Debug information for audio system */
export interface AudioDebugInfo {
  contextState: string;
  isEnabled: boolean;
  buffersLoaded: number;
  pendingLoads: number;
  fallbacksAvailable: number;
  speechAvailable: boolean | null;
  userInteractionReceived: boolean;
  isMobile: boolean;
  preferHTMLAudio: boolean;
  loadedPriorities: number[];
  preloadInProgress: boolean;
  sampleAliases: string[];
}

/** Number word to digit mapping */
export const NUMBER_WORD_TO_DIGIT: Record<string, string> = {
  one: "1",
  two: "2",
  three: "3",
  four: "4",
  five: "5",
  six: "6",
  seven: "7",
  eight: "8",
  nine: "9",
  ten: "10",
};

/** Digit to number word mapping (reverse of above) */
export const DIGIT_TO_WORD: Record<string, string> = Object.fromEntries(
  Object.entries(NUMBER_WORD_TO_DIGIT).map(([word, value]) => [value, word])
);
