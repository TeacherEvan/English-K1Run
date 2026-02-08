/**
 * Sound Playback Engine
 *
 * Handles Web Audio and HTMLAudio playback with tracking.
 * Extracted from sound-manager.ts for size and clarity.
 *
 * @module audio/sound-playback-engine
 */

import { HtmlAudioPlayback } from "./sound-html-audio";
import { SoundPlaybackFader } from "./sound-playback-fader";

export interface PlaybackContext {
  getAudioContext: () => AudioContext | null;
  getVolume: () => number;
}

export class SoundPlaybackEngine {
  private activeSources = new Map<string, AudioBufferSourceNode>();
  private activeGains = new Map<string, GainNode>();
  private htmlAudioPlayback: HtmlAudioPlayback;
  private fader: SoundPlaybackFader;

  constructor(private readonly context: PlaybackContext) {
    this.htmlAudioPlayback = new HtmlAudioPlayback({
      getVolume: () => this.context.getVolume(),
    });
    this.fader = new SoundPlaybackFader({
      getAudioContext: () => this.context.getAudioContext(),
      getVolume: () => this.context.getVolume(),
      activeSources: this.activeSources,
      activeGains: this.activeGains,
      stopExistingSource: (soundKey) => this.stopExistingSource(soundKey),
      registerSource: (soundKey, source, gainNode) =>
        this.registerSource(soundKey, source, gainNode),
    });
  }

  private registerSource(
    soundKey: string | undefined,
    source: AudioBufferSourceNode,
    gainNode: GainNode,
  ) {
    if (!soundKey) return;
    this.activeSources.set(soundKey, source);
    this.activeGains.set(soundKey, gainNode);
    source.onended = () => {
      this.activeSources.delete(soundKey);
      this.activeGains.delete(soundKey);
      source.onended = null;
    };
  }

  private stopExistingSource(soundKey?: string) {
    if (!soundKey || !this.activeSources.has(soundKey)) return;
    try {
      const prevSource = this.activeSources.get(soundKey)!;
      prevSource.stop();
      this.activeSources.delete(soundKey);
      this.activeGains.delete(soundKey);
    } catch {
      // Ignore errors from stopping already-stopped sources
    }
  }

  startBuffer(
    buffer: AudioBuffer,
    delaySeconds = 0,
    soundKey?: string,
    playbackRate = 1.0,
    volumeOverride?: number,
  ) {
    const audioContext = this.context.getAudioContext();
    if (!audioContext) return;

    this.stopExistingSource(soundKey);

    const source = audioContext.createBufferSource();
    const gainNode = audioContext.createGain();

    source.buffer = buffer;
    source.playbackRate.value = playbackRate;
    gainNode.gain.value = volumeOverride ?? this.context.getVolume();

    source.connect(gainNode);
    gainNode.connect(audioContext.destination);

    const startTime = audioContext.currentTime + Math.max(0, delaySeconds);
    source.start(startTime);

    this.registerSource(soundKey, source, gainNode);
  }

  startBufferWithFadeIn(
    buffer: AudioBuffer,
    delaySeconds = 0,
    soundKey?: string,
    playbackRate = 1.0,
    volumeOverride?: number,
    fadeInMs = 150,
  ) {
    this.fader.startBufferWithFadeIn(
      buffer,
      delaySeconds,
      soundKey,
      playbackRate,
      volumeOverride,
      fadeInMs,
    );
  }

  startBufferAsync(
    buffer: AudioBuffer,
    delaySeconds = 0,
    soundKey?: string,
    playbackRate = 1.0,
    volumeOverride?: number,
  ): Promise<void> {
    return new Promise((resolve) => {
      const audioContext = this.context.getAudioContext();
      if (!audioContext) {
        resolve();
        return;
      }

      this.stopExistingSource(soundKey);

      const source = audioContext.createBufferSource();
      const gainNode = audioContext.createGain();

      source.buffer = buffer;
      source.playbackRate.value = playbackRate;
      gainNode.gain.value = volumeOverride ?? this.context.getVolume();

      source.connect(gainNode);
      gainNode.connect(audioContext.destination);

      const startTime = audioContext.currentTime + Math.max(0, delaySeconds);
      source.start(startTime);

      this.registerSource(soundKey, source, gainNode);

      source.onended = () => {
        if (soundKey) {
          this.activeSources.delete(soundKey);
          this.activeGains.delete(soundKey);
        }
        resolve();
        // Clean up the listener to prevent memory leaks
        source.onended = null;
      };
    });
  }

  async playWithHtmlAudio(
    key: string,
    url: string,
    playbackRate = 1.0,
    maxDuration?: number,
    volumeOverride?: number,
  ): Promise<boolean> {
    return await this.htmlAudioPlayback.playWithHtmlAudio(
      key,
      url,
      playbackRate,
      maxDuration,
      volumeOverride,
    );
  }

  fadeOutKey(soundKey: string, durationMs = 250): boolean {
    return this.fader.fadeOutKey(soundKey, durationMs);
  }

  fadeOutAll(durationMs = 250) {
    this.fader.fadeOutAll(durationMs);
  }

  stopAllAudio() {
    for (const [key, source] of this.activeSources.entries()) {
      try {
        source.stop();
        this.activeSources.delete(key);
      } catch {
        // Source may have already stopped
      }
    }

    this.htmlAudioPlayback.stopAllAudio();
  }
}
