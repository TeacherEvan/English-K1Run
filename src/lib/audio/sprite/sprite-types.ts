/**
 * Audio Sprite Types
 *
 * Type definitions for audio sprite functionality.
 *
 * @module audio/sprite/sprite-types
 */

export interface AudioSpriteClip {
  /** Start time in seconds */
  start: number;
  /** End time in seconds */
  end: number;
  /** Optional human-readable description for accessibility */
  description?: string;
}

export interface AudioSpriteManifest {
  version?: number;
  spriteUrl?: string;
  clips: Record<string, AudioSpriteClip>;
}

export interface AudioSpriteConfigureOptions {
  spriteUrl: string;
  manifestUrl: string;
}

export interface AudioSpritePlayOptions {
  volume?: number;
  playbackRate?: number;
  /** Maximum duration in ms before force-stopping (safety) */
  maxDuration?: number;
}
