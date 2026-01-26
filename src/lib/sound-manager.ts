// Sound Manager - Enhanced audio system that supports wav and mp3 assets and speech-like cues

import { describeIfEnabled } from "./audio/audio-accessibility";
import { audioBufferLoader } from "./audio/audio-buffer-loader";
import { audioContextManager } from "./audio/audio-context-manager";
import { prefetchAudioKeys as prefetchAudioKeysInternal } from "./audio/audio-key-prefetcher";
import { audioPreloader } from "./audio/audio-preloader";
import { getAudioUrl, getRegisteredKeys, resolveCandidates } from "./audio/audio-registry";
import { audioSpritePlayer } from "./audio/audio-sprite";
import { SoundPlaybackEngine } from "./audio/sound-playback-engine";
import { SpeechPlayback } from "./audio/speech-playback";
import { speechSynthesizer } from "./audio/speech-synthesizer";
import { AudioPriority } from "./audio/types";
import { playWordInternal } from "./audio/word-playback";
import type { SupportedLanguage } from "./constants/language-config";
import { getLanguageConfig } from "./constants/language-config";

declare global {
  interface Window {
    __audioDebug?: {
      active: number;
      peak: number;
      lastSound?: string;
    };
  }
}

class SoundManager {
  private isEnabled = true;
  private volume = 0.6;
  private userInteractionReceived = false;
  private preferHTMLAudio = false;
  private currentLanguage: SupportedLanguage = "en";
  private useAudioSprite = false;
  private activePlaybackCount = 0;
  private peakPlaybackCount = 0;
  private playbackEngine = new SoundPlaybackEngine({
    getAudioContext: () => this.audioContext,
    getVolume: () => this.volume,
  });
  private speechPlayback = new SpeechPlayback();

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

  private get audioContext(): AudioContext | null {
    return audioContextManager.getContext();
  }

  private trackPlaybackStart(soundName: string) {
    this.activePlaybackCount += 1;
    this.peakPlaybackCount = Math.max(
      this.peakPlaybackCount,
      this.activePlaybackCount,
    );

    if (typeof window !== "undefined") {
      window.__audioDebug = {
        active: this.activePlaybackCount,
        peak: this.peakPlaybackCount,
        lastSound: soundName,
      };
    }
  }

  private trackPlaybackEnd(soundName?: string) {
    this.activePlaybackCount = Math.max(0, this.activePlaybackCount - 1);

    if (typeof window !== "undefined") {
      window.__audioDebug = {
        active: this.activePlaybackCount,
        peak: this.peakPlaybackCount,
        lastSound: soundName ?? window.__audioDebug?.lastSound,
      };
    }
  }

  private resolveCandidates(name: string): string[] {
    return resolveCandidates(name);
  }

  private async getUrl(key: string): Promise<string | null> {
    return getAudioUrl(key);
  }

  private async loadBufferForName(
    name: string,
    allowFallback = true,
  ): Promise<AudioBuffer | null> {
    return audioBufferLoader.loadBufferForName(name, allowFallback);
  }

  private async playVoiceClip(
    name: string,
    playbackRate = 1.0,
    maxDuration?: number,
    volumeOverride?: number,
  ): Promise<boolean> {
    const candidates = this.resolveCandidates(name);

    for (const candidate of candidates) {
      const url = await this.getUrl(candidate);
      if (!url) continue;
      const played = await this.playbackEngine.playWithHtmlAudio(
        candidate,
        url,
        playbackRate,
        maxDuration,
        volumeOverride,
      );
      if (played) {
        return true;
      }
    }

    return false;
  }

  private startBuffer(
    buffer: AudioBuffer,
    delaySeconds = 0,
    soundKey?: string,
    playbackRate = 1.0,
    volumeOverride?: number,
  ) {
    this.playbackEngine.startBuffer(
      buffer,
      delaySeconds,
      soundKey,
      playbackRate,
      volumeOverride,
    );
  }

  private startBufferAsync(
    buffer: AudioBuffer,
    delaySeconds = 0,
    soundKey?: string,
    playbackRate = 1.0,
    volumeOverride?: number,
  ): Promise<void> {
    return this.playbackEngine.startBufferAsync(
      buffer,
      delaySeconds,
      soundKey,
      playbackRate,
      volumeOverride,
    );
  }

  async ensureInitialized() {
    if (!this.isEnabled) {
      console.warn("[SoundManager] Audio is disabled");
      return;
    }

    await audioContextManager.ensureInitialized();
  }

  async preloadAudioByPriority(priority: AudioPriority): Promise<void> {
    await audioPreloader.preloadAudioByPriority(priority);
  }

  async startProgressiveLoading(): Promise<void> {
    if (!this.isEnabled) return;

    try {
      if (this.userInteractionReceived) {
        await audioPreloader.startProgressiveLoading();
      }
    } catch (error) {
      console.error("[SoundManager] Error during progressive loading:", error);
    }
  }

  stopAllAudio() {
    this.playbackEngine.stopAllAudio();

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Speech synthesis may not be available
      }
    }

    if (import.meta.env.DEV) {
      console.log("[SoundManager] Stopped all active audio");
    }

    this.activePlaybackCount = 0;
    if (typeof window !== "undefined") {
      window.__audioDebug = {
        active: 0,
        peak: this.peakPlaybackCount,
        lastSound: window.__audioDebug?.lastSound,
      };
    }
  }

  async playSound(
    soundName: string,
    playbackRate = 0.9,
    volumeOverride?: number,
  ): Promise<void> {
    if (!this.isEnabled) return;

    this.trackPlaybackStart(soundName);

    try {
      if (import.meta.env.DEV) {
        console.log(`[SoundManager] playSound called: "${soundName}"`);
      }

      if (this.useAudioSprite && audioSpritePlayer.isConfigured()) {
        const candidates = this.resolveCandidates(soundName);
        for (const candidate of candidates) {
          const played = await audioSpritePlayer.playClip(candidate, {
            playbackRate,
            volume: volumeOverride ?? this.volume,
          });
          if (played) {
            return;
          }
        }
      }

      if (this.preferHTMLAudio) {
        const candidates = this.resolveCandidates(soundName);
        for (const candidate of candidates) {
          const url = await this.getUrl(candidate);
          if (!url) continue;
          const played = await this.playbackEngine.playWithHtmlAudio(
            candidate,
            url,
            playbackRate,
            undefined,
            volumeOverride,
          );
          if (played) {
            if (import.meta.env.DEV) {
              console.log(
                `[SoundManager] Played with HTMLAudio: "${soundName}"`,
              );
            }
            return;
          }
        }
        console.warn(
          `[SoundManager] HTMLAudio failed for "${soundName}", falling back to Web Audio`,
        );
      }

      await this.ensureInitialized();
      if (!this.audioContext) {
        console.error("[SoundManager] No audio context available");
        return;
      }

      const buffer = await this.loadBufferForName(soundName);
      if (!buffer) {
        console.warn(
          `[SoundManager] Sound "${soundName}" not available, using fallback`,
        );
        describeIfEnabled(`Sound: ${soundName}`);
        return;
      }

      await this.startBufferAsync(
        buffer,
        0,
        soundName,
        playbackRate,
        volumeOverride,
      );
      if (import.meta.env.DEV) {
        console.log(`[SoundManager] Finished playing sound: "${soundName}"`);
      }
    } catch (error) {
      console.error("[SoundManager] Failed to play sound:", error);
      describeIfEnabled(`Sound failed: ${soundName}`);
    } finally {
      this.trackPlaybackEnd(soundName);
    }
  }

  getDebugInfo() {
    const loadedPriorities = [
      AudioPriority.CRITICAL,
      AudioPriority.COMMON,
      AudioPriority.RARE,
    ].filter((priority) => audioPreloader.isPriorityLoaded(priority));

    return {
      isEnabled: this.isEnabled,
      hasContext: !!this.audioContext,
      contextState: this.audioContext?.state,
      registeredAliases: getRegisteredKeys().length,
      cachedBuffers: audioBufferLoader.getLoadedCount(),
      pendingBuffers: audioBufferLoader.getPendingCount(),
      loadedPriorities: loadedPriorities.map((p) => AudioPriority[p]),
      sampleAliases: getRegisteredKeys().slice(0, 5),
    };
  }

  async playWord(phrase: string, volumeOverride?: number) {
    this.stopAllAudio();
    this.speechPlayback.resetQueue();
    return this.speechPlayback.enqueue(() =>
      playWordInternal(
        {
          ensureInitialized: () => this.ensureInitialized(),
          getAudioContext: () => this.audioContext,
          getVolume: () => this.volume,
          useAudioSprite: () => this.useAudioSprite,
          currentLanguage: () => this.currentLanguage,
          resolveCandidates: (name) => this.resolveCandidates(name),
          playVoiceClip: (...args) => this.playVoiceClip(...args),
          loadBufferForName: (...args) => this.loadBufferForName(...args),
          startBuffer: (...args) => this.startBuffer(...args),
          speechPlayback: this.speechPlayback,
        },
        phrase,
        volumeOverride,
        true,
        true,
      ),
    );
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  isInitialized(): boolean {
    return this.audioContext !== null;
  }

  async playSpeech(
    text: string,
    options?: { pitch?: number; rate?: number; volume?: number },
  ) {
    if (!this.isEnabled || !text) return;

    return this.speechPlayback.enqueue(async () => {
      try {
        if (!this.speechPlayback.canUseSpeech()) {
          console.warn("[SoundManager] Speech synthesis not available");
          return;
        }

        const synth = window.speechSynthesis;
        if (!synth) return;

        await new Promise<void>((resolve) => {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.pitch = options?.pitch ?? 1.0;
          utterance.rate = options?.rate ?? 1.0;
          utterance.volume = options?.volume ?? this.volume;

          utterance.onend = () => resolve();
          utterance.onerror = () => resolve();

          synth.speak(utterance);
        });

        if (import.meta.env.DEV) {
          console.log(
            `[SoundManager] Speaking with custom options: "${text}"`,
            options,
          );
        }
      } catch (error) {
        console.error("[SoundManager] Custom speech synthesis error:", error);
      }
    });
  }

  setLanguage(langCode: SupportedLanguage): void {
    if (this.currentLanguage === langCode) return;

    this.currentLanguage = langCode;

    try {
      speechSynthesizer.setLanguage(langCode);
    } catch (error) {
      console.warn(
        "[SoundManager] Failed to set speech synthesizer language:",
        error,
      );
    }

    if (import.meta.env.DEV) {
      console.log(`[SoundManager] Language changed to: ${langCode}`);
    }
  }

  getLanguage(): SupportedLanguage {
    return this.currentLanguage;
  }

  getLanguageVoiceId(): string {
    const config = getLanguageConfig(this.currentLanguage);
    return config.elevenLabsVoiceId;
  }

  async prefetchAudioKeys(keys: string[]): Promise<void> {
    if (!this.isEnabled || keys.length === 0) return;

    await prefetchAudioKeysInternal(keys, {
      useAudioSprite: this.useAudioSprite,
      resolveCandidates: (name) => this.resolveCandidates(name),
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
};

export const prefetchAudioKeys = (keys: string[]) =>
  soundManager.prefetchAudioKeys(keys);

export const getAudioDebugInfo = () => soundManager.getDebugInfo();
