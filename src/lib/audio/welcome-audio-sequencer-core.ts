/**
 * Welcome audio sequencer core.
 */

import { soundManager } from "../sound-manager";
import { WELCOME_AUDIO_ASSETS } from "./welcome-audio-assets";
import { playAudioSequence } from "./welcome-audio-player";
import {
  DEFAULT_WELCOME_CONFIG,
  PRIMARY_WELCOME_AUDIO_KEY,
  type AudioAssetMetadata,
  type WelcomeAudioConfig,
} from "./welcome-audio-types";
import { loadAudioWithDuration } from "./welcome-audio-utils";

export class WelcomeAudioSequencer {
  private activeTargetEmojis: Set<string> = new Set();
  private isPlaying = false;
  private currentProgress = { current: 0, total: 0 };

  setActiveTargetEmojis(emojis: string[]): void {
    this.activeTargetEmojis = new Set(emojis);
    if (import.meta.env.DEV) {
      console.log("[WelcomeAudioSequencer] Active targets updated:", emojis);
    }
  }

  clearActiveTargetEmojis(): void {
    this.activeTargetEmojis.clear();
  }

  getActiveTargetEmojis(): string[] {
    return Array.from(this.activeTargetEmojis);
  }

  private isAssociatedWithActiveTarget(asset: AudioAssetMetadata): boolean {
    if (!asset.associatedEmoji) return false;
    return this.activeTargetEmojis.has(asset.associatedEmoji);
  }

  private sortByDuration(
    assets: AudioAssetMetadata[],
    order: "desc" | "asc" = "desc",
  ): AudioAssetMetadata[] {
    return [...assets].sort((a, b) => {
      const comparison = a.duration - b.duration;
      return order === "desc" ? -comparison : comparison;
    });
  }

  private filterBySourcePriority(
    assets: AudioAssetMetadata[],
    priority: ("elevenlabs" | "generated" | "fallback")[],
  ): AudioAssetMetadata[] {
    const priorityMap = new Map(priority.map((p, i) => [p, i]));
    return assets
      .filter((asset) => priorityMap.has(asset.source))
      .sort((a, b) => {
        const aPriority = priorityMap.get(a.source) ?? Infinity;
        const bPriority = priorityMap.get(b.source) ?? Infinity;
        return aPriority - bPriority;
      });
  }

  getWelcomeAudioSequence(
    config: Partial<WelcomeAudioConfig> = {},
  ): AudioAssetMetadata[] {
    const fullConfig = { ...DEFAULT_WELCOME_CONFIG, ...config };

    let assets = [...WELCOME_AUDIO_ASSETS];
    assets = this.filterBySourcePriority(assets, fullConfig.sourcePriority);

    if (fullConfig.filterActiveTargets) {
      assets = assets.filter(
        (asset) => !this.isAssociatedWithActiveTarget(asset),
      );
    }

    assets = this.sortByDuration(assets, fullConfig.durationSortOrder);

    const primaryIndex = assets.findIndex(
      (asset) => asset.key === PRIMARY_WELCOME_AUDIO_KEY,
    );
    if (primaryIndex > 0) {
      const [primaryAsset] = assets.splice(primaryIndex, 1);
      assets.unshift(primaryAsset);
    }

    return assets.slice(0, fullConfig.maxSequenceLength);
  }

  isWelcomeSequencePlaying(): boolean {
    return this.isPlaying;
  }

  getWelcomeSequenceProgress(): { current: number; total: number } {
    return { ...this.currentProgress };
  }

  async playWelcomeSequence(
    config: Partial<WelcomeAudioConfig> = {},
    onProgress?: (
      current: number,
      total: number,
      asset: AudioAssetMetadata,
    ) => void,
  ): Promise<void> {
    if (this.isPlaying) {
      if (import.meta.env.DEV) {
        console.warn(
          "[WelcomeAudioSequencer] Sequence already playing, ignoring request",
        );
      }
      return;
    }

    const assets = this.getWelcomeAudioSequence(config);
    if (assets.length === 0) {
      if (import.meta.env.DEV) {
        console.warn("[WelcomeAudioSequencer] No assets to play");
      }
      return;
    }

    this.isPlaying = true;
    this.currentProgress = { current: 0, total: assets.length };

    const state = {
      isPlaying: this.isPlaying,
      currentProgress: this.currentProgress,
    };

    await playAudioSequence(assets, config, state, onProgress);

    this.isPlaying = state.isPlaying;
  }

  stopWelcomeSequence(): void {
    if (this.isPlaying) {
      this.isPlaying = false;
      soundManager.stopAllAudio();
      if (import.meta.env.DEV) {
        console.log("[WelcomeAudioSequencer] Sequence stopped");
      }
    }
  }

  async preloadWelcomeAudio(
    config: Partial<WelcomeAudioConfig> = {},
  ): Promise<void> {
    const assets = this.getWelcomeAudioSequence(config);

    if (import.meta.env.DEV) {
      console.log(
        `[WelcomeAudioSequencer] Preloading ${assets.length} assets...`,
      );
    }

    await Promise.all(
      assets.map(async (asset) => {
        try {
          await loadAudioWithDuration(asset.key);
        } catch (err) {
          if (import.meta.env.DEV) {
            console.warn(
              `[WelcomeAudioSequencer] Failed to preload ${asset.key}:`,
              err,
            );
          }
        }
      }),
    );

    if (import.meta.env.DEV) {
      console.log("[WelcomeAudioSequencer] Preload complete");
    }
  }
}
