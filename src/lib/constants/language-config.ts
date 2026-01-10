/**
 * Language configuration for multi-language support
 * Defines supported languages, voice IDs, and metadata for ElevenLabs integration
 */

export type SupportedLanguage = "en" | "fr" | "ja" | "th" | "zh-CN" | "zh-HK";

export interface LanguageConfig {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  elevenLabsVoiceId: string;
  languageCode: string; // ISO 639-1 code for ElevenLabs API
  voiceName: string;
  fallbackLocale: string; // For Web Speech API fallback
  direction: "ltr" | "rtl";
  fontFamily?: string; // For special script support (Thai, Mandarin, Cantonese)
}

export const LANGUAGE_CONFIGS: Record<SupportedLanguage, LanguageConfig> = {
  en: {
    code: "en",
    name: "English",
    nativeName: "English",
    elevenLabsVoiceId: "zmcVlqmyk3Jpn5AVYcAL", // Existing voice from codebase
    languageCode: "en",
    voiceName: "English US",
    fallbackLocale: "en-US",
    direction: "ltr",
  },
  fr: {
    code: "fr",
    name: "French",
    nativeName: "Français",
    elevenLabsVoiceId: "EXAVITQu4EsNXjluf0k5", // Native French speaker
    languageCode: "fr",
    voiceName: "French",
    fallbackLocale: "fr-FR",
    direction: "ltr",
  },
  ja: {
    code: "ja",
    name: "Japanese",
    nativeName: "日本語",
    elevenLabsVoiceId: "z9f4UheRPK2ZesPXd14b", // Native Japanese speaker
    languageCode: "ja",
    voiceName: "Japanese",
    fallbackLocale: "ja-JP",
    direction: "ltr",
    fontFamily: "Noto Sans JP, sans-serif",
  },
  th: {
    code: "th",
    name: "Thai",
    nativeName: "ไทย",
    elevenLabsVoiceId: "onwK4e9ZLuTAKqWW03F9", // Daniel - softer, warmer voice
    languageCode: "th",
    voiceName: "Thai",
    fallbackLocale: "th-TH",
    direction: "ltr",
    fontFamily: "Noto Sans Thai, sans-serif",
  },
  "zh-CN": {
    code: "zh-CN",
    name: "Mandarin",
    nativeName: "中文(简体)",
    elevenLabsVoiceId: "cjVigY5qzO86Huf0OWal", // Native Mandarin speaker
    languageCode: "zh-CN",
    voiceName: "Mandarin (Simplified)",
    fallbackLocale: "zh-CN",
    direction: "ltr",
    fontFamily: "Noto Sans SC, sans-serif",
  },
  "zh-HK": {
    code: "zh-HK",
    name: "Cantonese",
    nativeName: "粵語",
    elevenLabsVoiceId: "wVcwzhXu7f0K5a1WoqaJ", // Native Cantonese speaker
    languageCode: "zh",
    voiceName: "Cantonese",
    fallbackLocale: "zh-HK",
    direction: "ltr",
    fontFamily: "Noto Sans TC, sans-serif",
  },
};

export const DEFAULT_LANGUAGE: SupportedLanguage = "en";

export const LANGUAGE_OPTIONS = Object.values(LANGUAGE_CONFIGS).map(
  (config) => ({
    value: config.code,
    label: config.name,
    nativeLabel: config.nativeName,
  })
);

/**
 * Get language config by code
 */
export function getLanguageConfig(code: SupportedLanguage): LanguageConfig {
  return LANGUAGE_CONFIGS[code];
}

/**
 * Check if a code is a supported language
 */
export function isSupportedLanguage(code: string): code is SupportedLanguage {
  return code in LANGUAGE_CONFIGS;
}
