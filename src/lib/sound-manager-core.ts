/**
 * Sound manager core implementation.
 */

import { audioContextManager } from "./audio/audio-context-manager";
import { prefetchAudioKeys as prefetchAudioKeysInternal } from "./audio/audio-key-prefetcher";
import { audioPreloader } from "./audio/audio-preloader";
import { audioSpritePlayer } from "./audio/audio-sprite";
import { SoundPlaybackEngine } from "./audio/sound-playback-engine";
import { speechSynthesizer } from "./audio/speech-synthesizer";
import { AudioPriority } from "./audio/types";
import type { SupportedLanguage } from "./constants/language-config";
import { SoundFadePlayback } from "./sound-manager-fade";
import {
  createManagerPlayback,
  createManagerSpeechControls,
} from "./sound-manager-initializers";
import {
  getAudioContext,
  loadBufferForName,
  resolveAudioCandidates,
} from "./sound-manager/helpers";
import { createPlaybackTelemetry } from "./sound-manager/telemetry";

class SoundManager {
  private isEnabled = true;
  private volume = 0.6;
  private userInteractionReceived = false;
  private preferHTMLAudio = false;
  private useAudioSprite = false;
  private playbackEngine = new SoundPlaybackEngine({
    getAudioContext: () => getAudioContext(),
    getVolume: () => this.volume,
  });
  private telemetry = createPlaybackTelemetry(() => this.isEnabled);
  private playback = createManagerPlayback({
    isEnabled: () => this.isEnabled,
    getVolume: () => this.volume,
    ensureInitialized: () => this.ensureInitialized(),
    useAudioSprite: () => this.useAudioSprite,
    preferHTMLAudio: () => this.preferHTMLAudio,
    playbackEngine: this.playbackEngine,
    trackPlaybackStart: (name) => this.telemetry.trackStart(name),
    trackPlaybackEnd: (name) => this.telemetry.trackEnd(name),
  });
  private speechControls = createManagerSpeechControls({
    ensureInitialized: () => this.ensureInitialized(),
    getVolume: () => this.volume,
    useAudioSprite: () => this.useAudioSprite,
    playbackEngine: this.playbackEngine,
    playVoiceClip: (name, rate, maxDuration, volume) =>
      this.playback.playVoiceClip(name, rate, maxDuration, volume),
    stopAllAudio: () => this.stopAllAudio(),
    isEnabled: () => this.isEnabled,
  });
  private fadePlayback = new SoundFadePlayback({
    isEnabled: () => this.isEnabled,
    ensureInitialized: () => this.ensureInitialized(),
    getAudioContext: () => getAudioContext(),
    loadBufferForName: (name, allowFallback) =>
      loadBufferForName(name, allowFallback),
    playSound: (soundName, playbackRate, volumeOverride) =>
      this.playback.playSound(soundName, playbackRate, volumeOverride),
    startBufferWithFadeIn: (
      buffer,
      delaySeconds,
      soundKey,
      playbackRate,
      volumeOverride,
      fadeInMs,
    ) =>
      this.playbackEngine.startBufferWithFadeIn(
        buffer,
        delaySeconds,
        soundKey,
        playbackRate,
        volumeOverride,
        fadeInMs,
      ),
    trackPlaybackStart: (name) => this.telemetry.trackStart(name),
    trackPlaybackEnd: (name) => this.telemetry.trackEnd(name),
  });
  constructor() {
    this.useAudioSprite = import.meta.env.VITE_AUDIO_SPRITE_ENABLED === "1";
    if (this.useAudioSprite) {
      const spriteUrl =
        import.meta.env.VITE_AUDIO_SPRITE_URL || "/audio-sprites/sprite.mp3";
      const manifestUrl =
        import.meta.env.VITE_AUDIO_SPRITE_MANIFEST_URL ||
        "/audio-sprites/sprite.json";
      audioSpritePlayer.configure({ spriteUrl, manifestUrl });
    }
    this.preferHTMLAudio = false;
    audioContextManager.onReady(() => {
      this.userInteractionReceived = true;
      void this.startProgressiveLoading();
    });
    void audioContextManager.ensureInitialized();
    audioContextManager.onReady(() => {
      void audioPreloader.preloadAudioByPriority(AudioPriority.CRITICAL);
    });
  }
  async ensureInitialized() {
    if (!this.isEnabled) return;
    await audioContextManager.ensureInitialized();
  }

  async preloadAudioByPriority(priority: AudioPriority): Promise<void> {
    await audioPreloader.preloadAudioByPriority(priority);
  }
  async startProgressiveLoading(): Promise<void> {
    if (!this.isEnabled || !this.userInteractionReceived) return;
    try {
      await audioPreloader.startProgressiveLoading();
    } catch {
      /* silent fail */
    }
  }
  stopAllAudio() {
    this.playbackEngine.stopAllAudio();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        /* silent */
      }
    }
    try {
      speechSynthesizer.stop();
    } catch {
      /* silent */
    }
    this.telemetry.reset();
  }
  fadeOutAll(durationMs = 250) {
    this.playbackEngine.fadeOutAll(durationMs);
  }

  fadeOutKey(soundKey: string, durationMs = 250): boolean {
    return this.playbackEngine.fadeOutKey(soundKey, durationMs);
  }
  async playSound(
    soundName: string,
    playbackRate = 0.9,
    volumeOverride?: number,
  ): Promise<void> {
    await this.playback.playSound(soundName, playbackRate, volumeOverride);
  }

  async playSoundWithFade(
    soundName: string,
    playbackRate = 0.9,
    volumeOverride?: number,
    fadeInMs = 150,
  ): Promise<void> {
    await this.fadePlayback.playSoundWithFade(
      soundName,
      playbackRate,
      volumeOverride,
      fadeInMs,
    );
  }

  getDebugInfo() {
    return this.telemetry.getDebugInfo(getAudioContext());
  }
  async playWord(phrase: string, volumeOverride?: number) {
    return this.speechControls.playWord(phrase, volumeOverride);
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
  }
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }
  isInitialized(): boolean {
    return getAudioContext() !== null;
  }
  async playSpeech(
    text: string,
    options?: { pitch?: number; rate?: number; volume?: number },
  ) {
    return this.speechControls.playSpeech(text, options);
  }

  setLanguage(langCode: SupportedLanguage): void {
    this.speechControls.setLanguage(langCode);
  }
  getLanguage(): SupportedLanguage {
    return this.speechControls.getLanguage();
  }
  getLanguageVoiceId(): string {
    return this.speechControls.getLanguageVoiceId();
  }
  async prefetchAudioKeys(keys: string[]): Promise<void> {
    if (!this.isEnabled || keys.length === 0) return;

    await prefetchAudioKeysInternal(keys, {
      useAudioSprite: this.useAudioSprite,
      resolveCandidates: (name) => resolveAudioCandidates(name),
    });
  }
}

export const soundManager = new SoundManager();
