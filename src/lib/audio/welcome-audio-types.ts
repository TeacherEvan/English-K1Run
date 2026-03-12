/**
 * Welcome audio types and defaults.
 */

import type { SupportedLanguage } from "@/lib/constants/language-config";

export interface AudioAssetMetadata {
  key: string;
  duration: number;
  source: "elevenlabs" | "generated" | "fallback";
  category: "welcome" | "instruction" | "association" | "learning";
  language?: SupportedLanguage;
  associatedEmoji?: string;
  fallbackText?: string;
}

export interface WelcomeAudioConfig {
  language?: SupportedLanguage;
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
export const PRIMARY_THAI_WELCOME_AUDIO_KEY = "welcome_evan_intro_thai";

export const getPrimaryWelcomeAudioKey = (
  language: SupportedLanguage = "en",
) =>
  language === "th"
    ? PRIMARY_THAI_WELCOME_AUDIO_KEY
    : PRIMARY_WELCOME_AUDIO_KEY;
