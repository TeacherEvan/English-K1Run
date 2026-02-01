/**
 * Welcome Audio Sequencer
 *
 * Configures audio playback for the WELCOME startup display with:
 * - ElevenLabs-generated audio asset prioritization
 * - Duration-based sorting (longest to shortest)
 * - Sequential playback queue
 * - Target emoji filtering based on active gameplay
 *
 * @module audio/welcome-audio-sequencer
 */

import { soundManager } from "../sound-manager";
import { audioBufferLoader } from "./audio-buffer-loader";
import { getAudioUrl } from "./audio-registry";

/** Metadata for audio assets including duration */
export interface AudioAssetMetadata {
  key: string;
  duration: number;
  source: "elevenlabs" | "generated" | "fallback";
  category: "welcome" | "instruction" | "association" | "learning";
  associatedEmoji?: string;
}

/** Configuration for the welcome audio sequencer */
export interface WelcomeAudioConfig {
  /** Priority order for audio sources */
  sourcePriority: ("elevenlabs" | "generated" | "fallback")[];
  /** Sort order for duration: "desc" = longest first, "asc" = shortest first */
  durationSortOrder: "desc" | "asc";
  /** Whether to filter out clips associated with active target emojis */
  filterActiveTargets: boolean;
  /** Delay between sequential clips in ms */
  sequentialDelayMs: number;
  /** Maximum number of clips to play in sequence */
  maxSequenceLength: number;
}

/** Default configuration prioritizing ElevenLabs, longest duration first */
export const DEFAULT_WELCOME_CONFIG: WelcomeAudioConfig = {
  sourcePriority: ["elevenlabs", "generated", "fallback"],
  durationSortOrder: "desc",
  filterActiveTargets: true,
  sequentialDelayMs: 500,
  maxSequenceLength: 10,
};

/** Primary greeting that must play first */
export const PRIMARY_WELCOME_AUDIO_KEY = "welcome_evan_intro";

/** Welcome audio asset registry with duration metadata */
export const WELCOME_AUDIO_ASSETS: AudioAssetMetadata[] = [
  // Primary welcome intro (ElevenLabs - Teacher Evan)
  {
    key: PRIMARY_WELCOME_AUDIO_KEY,
    duration: 4.5,
    source: "elevenlabs",
    category: "welcome",
  },
  // Sangsom association messages
  {
    key: "welcome_sangsom_association",
    duration: 4.8,
    source: "elevenlabs",
    category: "association",
  },
  {
    key: "welcome_sangsom_association_thai",
    duration: 3.8,
    source: "elevenlabs",
    category: "association",
  },
  // Legacy welcome messages (kept for compatibility)
  {
    key: "welcome_association",
    duration: 2.8,
    source: "generated",
    category: "association",
  },
  {
    key: "welcome_learning",
    duration: 3.0,
    source: "generated",
    category: "learning",
  },
  {
    key: "welcome_association_thai",
    duration: 3.2,
    source: "generated",
    category: "association",
  },
  {
    key: "welcome_learning_thai",
    duration: 3.4,
    source: "generated",
    category: "learning",
  },
];

/**
 * Welcome Audio Sequencer Class
 *
 * Encapsulates sequencer state and provides methods for managing
 * welcome audio playback with proper lifecycle management.
 */
class WelcomeAudioSequencer {
  private activeTargetEmojis: Set<string> = new Set();
  private isPlaying = false;
  private currentProgress = { current: 0, total: 0 };

  /**
   * Set the active target emojis to filter from welcome audio
   * Called by game logic when targets change
   */
  setActiveTargetEmojis(emojis: string[]): void {
    this.activeTargetEmojis = new Set(emojis);
    if (import.meta.env.DEV) {
      console.log("[WelcomeAudioSequencer] Active targets updated:", emojis);
    }
  }

  /**
   * Clear active target emoji filters
   */
  clearActiveTargetEmojis(): void {
    this.activeTargetEmojis.clear();
  }

  /**
   * Get currently filtered target emojis
   */
  getActiveTargetEmojis(): string[] {
    return Array.from(this.activeTargetEmojis);
  }

  /**
   * Check if an audio asset is associated with an active target emoji
   */
  private isAssociatedWithActiveTarget(asset: AudioAssetMetadata): boolean {
    if (!asset.associatedEmoji) return false;
    return this.activeTargetEmojis.has(asset.associatedEmoji);
  }

  /**
   * Sort audio assets by duration
   */
  private sortByDuration(
    assets: AudioAssetMetadata[],
    order: "desc" | "asc" = "desc",
  ): AudioAssetMetadata[] {
    return [...assets].sort((a, b) => {
      const comparison = a.duration - b.duration;
      return order === "desc" ? -comparison : comparison;
    });
  }

  /**
   * Filter assets by source priority
   */
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

  /**
   * Get available welcome audio assets sorted and filtered according to config
   */
  getWelcomeAudioSequence(
    config: Partial<WelcomeAudioConfig> = {},
  ): AudioAssetMetadata[] {
    const fullConfig = { ...DEFAULT_WELCOME_CONFIG, ...config };

    // Start with all welcome assets
    let assets = [...WELCOME_AUDIO_ASSETS];

    // Filter by source priority (ElevenLabs first)
    assets = this.filterBySourcePriority(assets, fullConfig.sourcePriority);

    // Filter out assets associated with active targets if enabled
    if (fullConfig.filterActiveTargets) {
      assets = assets.filter(
        (asset) => !this.isAssociatedWithActiveTarget(asset),
      );
    }

    // Sort by duration
    assets = this.sortByDuration(assets, fullConfig.durationSortOrder);

    // Force the primary greeting to be first if present
    const primaryIndex = assets.findIndex(
      (asset) => asset.key === PRIMARY_WELCOME_AUDIO_KEY,
    );
    if (primaryIndex > 0) {
      const [primaryAsset] = assets.splice(primaryIndex, 1);
      assets.unshift(primaryAsset);
    }

    // Limit sequence length
    assets = assets.slice(0, fullConfig.maxSequenceLength);

    return assets;
  }

  /**
   * Check if a welcome sequence is currently playing
   */
  isWelcomeSequencePlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * Get the current sequence progress
   */
  getWelcomeSequenceProgress(): {
    current: number;
    total: number;
  } {
    return { ...this.currentProgress };
  }

  /**
   * Play the welcome audio sequence
   * @param config - Optional configuration overrides
   * @param onProgress - Callback fired when each asset starts playing
   */
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

    const fullConfig = { ...DEFAULT_WELCOME_CONFIG, ...config };

    try {
      for (let i = 0; i < assets.length; i++) {
        if (!this.isPlaying) {
          // Sequence was stopped
          break;
        }

        const asset = assets[i];
        this.currentProgress.current = i + 1;

        // Notify progress
        onProgress?.(i + 1, assets.length, asset);

        if (import.meta.env.DEV) {
          console.log(
            `[WelcomeAudioSequencer] Playing ${i + 1}/${assets.length}: ${asset.key}`,
          );
        }

        // Play the sound through soundManager
        try {
          await soundManager.playSound(asset.key, 1.0, 1.0);
        } catch (err) {
          if (import.meta.env.DEV) {
            console.warn(
              `[WelcomeAudioSequencer] Failed to play ${asset.key}:`,
              err,
            );
          }
          // Continue with next asset even if this one failed
        }

        // Wait for the delay between clips (except after the last one)
        if (i < assets.length - 1 && fullConfig.sequentialDelayMs > 0) {
          await new Promise((resolve) =>
            setTimeout(resolve, fullConfig.sequentialDelayMs),
          );
        }
      }
    } finally {
      this.isPlaying = false;
    }
  }

  /**
   * Stop the currently playing welcome sequence
   */
  stopWelcomeSequence(): void {
    if (this.isPlaying) {
      this.isPlaying = false;
      soundManager.stopAllAudio();
      if (import.meta.env.DEV) {
        console.log("[WelcomeAudioSequencer] Sequence stopped");
      }
    }
  }

  /**
   * Preload all welcome audio assets
   */
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

// Singleton instance
export const welcomeAudioSequencer = new WelcomeAudioSequencer();

// Convenience functions for backward compatibility
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

/**
 * Load audio buffer and get actual duration
 */
async function loadAudioWithDuration(
  key: string,
): Promise<{ buffer: AudioBuffer | null; duration: number }> {
  try {
    const buffer = await audioBufferLoader.loadBufferForName(key, false);
    if (buffer) {
      return { buffer, duration: buffer.duration };
    }
  } catch {
    // Fall through to URL-based loading
  }

  // Fallback: try to get URL and load via HTMLAudio to get duration
  const url = await getAudioUrl(key);
  if (!url) {
    return { buffer: null, duration: 0 };
  }

  return new Promise((resolve) => {
    const audio = new Audio(url);
    const cleanup = () => {
      audio.pause();
      audio.src = "";
      audio.load();
    };

    audio.addEventListener(
      "loadedmetadata",
      () => {
        cleanup();
        resolve({ buffer: null, duration: audio.duration });
      },
      { once: true },
    );
    audio.addEventListener(
      "error",
      () => {
        cleanup();
        resolve({ buffer: null, duration: 0 });
      },
      { once: true },
    );
    // Trigger loading
    audio.load();
  });
}
