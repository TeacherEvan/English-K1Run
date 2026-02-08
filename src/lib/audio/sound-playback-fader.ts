/**
 * Gain-ramp utilities for smoother audio playback.
 */

export interface SoundFadeDependencies {
  getAudioContext: () => AudioContext | null;
  getVolume: () => number;
  activeSources: Map<string, AudioBufferSourceNode>;
  activeGains: Map<string, GainNode>;
  stopExistingSource: (soundKey?: string) => void;
  registerSource: (
    soundKey: string | undefined,
    source: AudioBufferSourceNode,
    gainNode: GainNode,
  ) => void;
}

export class SoundPlaybackFader {
  constructor(private readonly deps: SoundFadeDependencies) {}

  private scheduleGainRamp(
    gainNode: GainNode,
    targetGain: number,
    durationMs: number,
    startTime: number,
  ) {
    const durationSeconds = Math.max(0, durationMs) / 1000;
    const currentValue = gainNode.gain.value;
    gainNode.gain.cancelScheduledValues(startTime);
    gainNode.gain.setValueAtTime(currentValue, startTime);
    gainNode.gain.linearRampToValueAtTime(
      targetGain,
      startTime + durationSeconds,
    );
  }

  startBufferWithFadeIn(
    buffer: AudioBuffer,
    delaySeconds = 0,
    soundKey?: string,
    playbackRate = 1.0,
    volumeOverride?: number,
    fadeInMs = 150,
  ) {
    const audioContext = this.deps.getAudioContext();
    if (!audioContext) return;

    this.deps.stopExistingSource(soundKey);

    const source = audioContext.createBufferSource();
    const gainNode = audioContext.createGain();

    source.buffer = buffer;
    source.playbackRate.value = playbackRate;

    const targetGain = volumeOverride ?? this.deps.getVolume();
    const startTime = audioContext.currentTime + Math.max(0, delaySeconds);

    if (fadeInMs > 0) {
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(
        targetGain,
        startTime + Math.max(0, fadeInMs) / 1000,
      );
    } else {
      gainNode.gain.value = targetGain;
    }

    source.connect(gainNode);
    gainNode.connect(audioContext.destination);

    source.start(startTime);

    this.deps.registerSource(soundKey, source, gainNode);
  }

  fadeOutKey(soundKey: string, durationMs = 250): boolean {
    const audioContext = this.deps.getAudioContext();
    if (!audioContext) return false;

    const source = this.deps.activeSources.get(soundKey);
    const gainNode = this.deps.activeGains.get(soundKey);
    if (!source || !gainNode) return false;

    const now = audioContext.currentTime;
    this.scheduleGainRamp(gainNode, 0, durationMs, now);

    const stopTime = now + Math.max(0, durationMs) / 1000 + 0.01;
    try {
      source.stop(stopTime);
    } catch {
      // Ignore errors from stopping already-stopped sources
    }

    window.setTimeout(
      () => {
        if (this.deps.activeSources.has(soundKey)) {
          this.deps.activeSources.delete(soundKey);
        }
        if (this.deps.activeGains.has(soundKey)) {
          this.deps.activeGains.delete(soundKey);
        }
      },
      Math.max(0, durationMs) + 50,
    );

    return true;
  }

  fadeOutAll(durationMs = 250) {
    for (const key of this.deps.activeSources.keys()) {
      this.fadeOutKey(key, durationMs);
    }
  }
}
