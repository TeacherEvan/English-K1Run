/**
 * Welcome audio types and defaults.
 */

export interface AudioAssetMetadata {
  key: string;
  duration: number;
  source: "elevenlabs" | "generated" | "fallback";
  category: "welcome" | "instruction" | "association" | "learning";
  associatedEmoji?: string;
  fallbackText?: string;
}

export interface WelcomeAudioConfig {
  sourcePriority: ("elevenlabs" | "generated" | "fallback")[];
  durationSortOrder: "desc" | "asc";
  filterActiveTargets: boolean;
  sequentialDelayMs: number;
  maxSequenceLength: number;
}

export const DEFAULT_WELCOME_CONFIG: WelcomeAudioConfig = {
  sourcePriority: ["elevenlabs", "generated", "fallback"],
  durationSortOrder: "desc",
  filterActiveTargets: true,
  sequentialDelayMs: 500,
  maxSequenceLength: 3,
};

export const PRIMARY_WELCOME_AUDIO_KEY = "welcome_evan_intro";
