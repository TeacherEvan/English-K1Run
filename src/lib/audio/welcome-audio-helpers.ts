/**
 * Welcome audio sequencing helpers.
 */

import { WelcomeAudioSequencer } from "./welcome-audio-sequencer-core";
import type {
  AudioAssetMetadata,
  WelcomeAudioConfig,
} from "./welcome-audio-types";

export const welcomeAudioSequencer = new WelcomeAudioSequencer();

export function setActiveTargetEmojis(emojis: string[]): void {
  welcomeAudioSequencer.setActiveTargetEmojis(emojis);
}

export function clearActiveTargetEmojis(): void {
  welcomeAudioSequencer.clearActiveTargetEmojis();
}

export function getActiveTargetEmojis(): string[] {
  return welcomeAudioSequencer.getActiveTargetEmojis();
}

export function getWelcomeAudioSequence(
  config?: Partial<WelcomeAudioConfig>,
): AudioAssetMetadata[] {
  return welcomeAudioSequencer.getWelcomeAudioSequence(config);
}

export function isWelcomeSequencePlaying(): boolean {
  return welcomeAudioSequencer.isWelcomeSequencePlaying();
}

export function getWelcomeSequenceProgress(): {
  current: number;
  total: number;
} {
  return welcomeAudioSequencer.getWelcomeSequenceProgress();
}

export async function playWelcomeSequence(
  config?: Partial<WelcomeAudioConfig>,
  onProgress?: (
    current: number,
    total: number,
    asset: AudioAssetMetadata,
  ) => void,
): Promise<void> {
  return welcomeAudioSequencer.playWelcomeSequence(config, onProgress);
}

export function stopWelcomeSequence(): void {
  welcomeAudioSequencer.stopWelcomeSequence();
}

export async function preloadWelcomeAudio(
  config?: Partial<WelcomeAudioConfig>,
): Promise<void> {
  return welcomeAudioSequencer.preloadWelcomeAudio(config);
}
