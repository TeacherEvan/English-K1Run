import { WELCOME_AUDIO_ASSETS } from "@/lib/audio/welcome-audio-sequencer";
import type { SupportedLanguage } from "@/lib/constants/language-config";
import { prefetchAudioKeys } from "@/lib/sound-manager";
import { isLimitedBandwidth } from "@/lib/resource-preloader";
import {
  hasWarmedLanguagePack,
  markWarmedLanguagePack,
} from "./startup-persistence";

type LanguageAudioMap = Partial<Record<SupportedLanguage, string[]>>;

export const DEFAULT_STARTUP_AUDIO_LANGUAGES: SupportedLanguage[] = [
  "en",
  "th",
];

const buildLanguageAudioMap = (): LanguageAudioMap =>
  WELCOME_AUDIO_ASSETS.reduce<LanguageAudioMap>((map, asset) => {
    if (!asset.language) {
      return map;
    }

    const existing = map[asset.language] ?? [];
    if (!existing.includes(asset.key)) {
      map[asset.language] = [...existing, asset.key];
    }
    return map;
  }, {});

export const getLanguageAudioPrefetchKeys = (
  language: SupportedLanguage,
  languageMap: LanguageAudioMap = buildLanguageAudioMap(),
): string[] => languageMap[language] ?? [];

interface PrefetchLanguageAudioOptions {
  limitedBandwidth?: boolean;
  languageMap?: LanguageAudioMap;
  prefetchKeys?: (keys: string[]) => Promise<void>;
  hasWarmPack?: (language: SupportedLanguage) => boolean;
  markWarmPack?: (language: SupportedLanguage) => void;
}

export const prefetchSelectedLanguageAudioPack = async (
  language: SupportedLanguage,
  options: PrefetchLanguageAudioOptions = {},
): Promise<boolean> => {
  if (DEFAULT_STARTUP_AUDIO_LANGUAGES.includes(language)) {
    return false;
  }

  const limitedBandwidth = options.limitedBandwidth ?? isLimitedBandwidth();
  if (limitedBandwidth) {
    return false;
  }

  const hasWarmPack = options.hasWarmPack ?? hasWarmedLanguagePack;
  if (hasWarmPack(language)) {
    return false;
  }

  const keys = getLanguageAudioPrefetchKeys(language, options.languageMap);
  if (keys.length === 0) {
    return false;
  }

  const prefetch = options.prefetchKeys ?? prefetchAudioKeys;
  await prefetch(keys);
  const markWarmPack = options.markWarmPack ?? markWarmedLanguagePack;
  markWarmPack(language);
  return true;
};
