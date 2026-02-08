/**
 * Fade-aware playback helper for SoundManager.
 */

export interface SoundFadeDependencies {
  isEnabled: () => boolean;
  ensureInitialized: () => Promise<void>;
  getAudioContext: () => AudioContext | null;
  loadBufferForName: (name: string) => Promise<AudioBuffer | null>;
  playSound: (
    soundName: string,
    playbackRate?: number,
    volumeOverride?: number,
  ) => Promise<void>;
  startBufferWithFadeIn: (
    buffer: AudioBuffer,
    delaySeconds: number,
    soundKey?: string,
    playbackRate?: number,
    volumeOverride?: number,
    fadeInMs?: number,
  ) => void;
  trackPlaybackStart: (soundName: string) => void;
  trackPlaybackEnd: (soundName?: string) => void;
}

export class SoundFadePlayback {
  constructor(private readonly deps: SoundFadeDependencies) {}

  async playSoundWithFade(
    soundName: string,
    playbackRate = 0.9,
    volumeOverride?: number,
    fadeInMs = 150,
  ): Promise<void> {
    if (!this.deps.isEnabled()) return;
    this.deps.trackPlaybackStart(soundName);
    try {
      await this.deps.ensureInitialized();
      if (!this.deps.getAudioContext()) return;
      const buffer = await this.deps.loadBufferForName(soundName);
      if (!buffer) {
        await this.deps.playSound(soundName, playbackRate, volumeOverride);
        return;
      }
      this.deps.startBufferWithFadeIn(
        buffer,
        0,
        soundName,
        playbackRate,
        volumeOverride,
        fadeInMs,
      );
    } catch (error) {
      console.error("[SoundManager] Failed to play sound:", error);
    } finally {
      this.deps.trackPlaybackEnd(soundName);
    }
  }
}
