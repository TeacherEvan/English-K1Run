/**
 * Sound manager entry point.
 */

import { audioContextManager } from "./audio/audio-context-manager";
import { prefetchAudioKeys as prefetchAudioKeysInternal } from "./audio/audio-key-prefetcher";
import { audioPreloader } from "./audio/audio-preloader";
import { audioSpritePlayer } from "./audio/audio-sprite";
import { SoundPlaybackEngine } from "./audio/sound-playback-engine";
import { AudioPriority } from "./audio/types";
import type { SupportedLanguage } from "./constants/language-config";
import {
  getAudioContext,
  getAudioUrlForKey,
  loadBufferForName,
  resolveAudioCandidates,
  startBuffer,
  startBufferAsync,
} from "./sound-manager/helpers";
import { createSoundPlayback } from "./sound-manager/playback";
import { createSpeechControls } from "./sound-manager/speech";
import { createPlaybackTelemetry } from "./sound-manager/telemetry";

declare global {
  interface Window {
    __audioDebug?: {
      active: number;
      current: number;
      peak: number;
      total: number;
      lastSound?: string;
    };
  }
}

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
  private playback = createSoundPlayback({
    isEnabled: () => this.isEnabled,
    getAudioContext: () => getAudioContext(),
    getVolume: () => this.volume,
    ensureInitialized: () => this.ensureInitialized(),
    useAudioSprite: () => this.useAudioSprite,
    preferHTMLAudio: () => this.preferHTMLAudio,
    resolveCandidates: (name) => resolveAudioCandidates(name),
    getUrl: (key) => getAudioUrlForKey(key),
    loadBufferForName: (name, allowFallback) =>
      loadBufferForName(name, allowFallback),
    startBufferAsync: (buffer, delaySeconds, soundKey, playbackRate, volume) =>
      startBufferAsync(
        this.playbackEngine,
        buffer,
        delaySeconds,
        soundKey,
        playbackRate,
        volume,
      ),
    playbackEngine: this.playbackEngine,
    trackPlaybackStart: (name) => this.telemetry.trackStart(name),
    trackPlaybackEnd: (name) => this.telemetry.trackEnd(name),
  });
  private speechControls = createSpeechControls({
    ensureInitialized: () => this.ensureInitialized(),
    getAudioContext: () => getAudioContext(),
    getVolume: () => this.volume,
    useAudioSprite: () => this.useAudioSprite,
    resolveCandidates: (name) => resolveAudioCandidates(name),
    playVoiceClip: (name, rate, maxDuration, volume) =>
      this.playback.playVoiceClip(name, rate, maxDuration, volume),
    loadBufferForName: (name, allowFallback) =>
      loadBufferForName(name, allowFallback),
    startBuffer: (buffer, delaySeconds, soundKey, rate, volume) =>
      startBuffer(
        this.playbackEngine,
        buffer,
        delaySeconds,
        soundKey,
        rate,
        volume,
      ),
    stopAllAudio: () => this.stopAllAudio(),
    isEnabled: () => this.isEnabled,
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
    this.telemetry.reset();
  }

  async playSound(
    soundName: string,
    playbackRate = 0.9,
    volumeOverride?: number,
  ): Promise<void> {
    await this.playback.playSound(soundName, playbackRate, volumeOverride);
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

export const playSoundEffect = {
  voice: (phrase: string) => soundManager.playWord(phrase),
  sticker: () => {
    soundManager.playSpeech("GIVE THEM A STICKER!", { pitch: 1.2, rate: 1.1 });
  },
  welcome: async () => soundManager.playSound("welcome"),
  stopAll: () => soundManager.stopAllAudio(),
  targetSpawn: () => {},
  targetHit: () => {},
  targetMiss: () => soundManager.playSound("explosion"),
};

export const prefetchAudioKeys = (keys: string[]) =>
  soundManager.prefetchAudioKeys(keys);

export const getAudioDebugInfo = () => soundManager.getDebugInfo();
