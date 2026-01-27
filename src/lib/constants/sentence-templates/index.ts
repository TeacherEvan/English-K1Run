import type { SupportedLanguage } from "../language-config";
import { DEFAULT_LANGUAGE } from "../language-config";

import { ENGLISH_SENTENCE_TEMPLATES } from "./en";
import { FRENCH_SENTENCE_TEMPLATES } from "./fr";
import { JAPANESE_SENTENCE_TEMPLATES } from "./ja";
import { THAI_SENTENCE_TEMPLATES } from "./th";
import { MANDARIN_SENTENCE_TEMPLATES } from "./zh-cn";
import { CANTONESE_SENTENCE_TEMPLATES } from "./zh-hk";

// Language template mapping
const LANGUAGE_TEMPLATES: Record<SupportedLanguage, Record<string, string>> = {
  en: ENGLISH_SENTENCE_TEMPLATES,
  fr: FRENCH_SENTENCE_TEMPLATES,
  ja: JAPANESE_SENTENCE_TEMPLATES,
  th: THAI_SENTENCE_TEMPLATES,
  "zh-CN": MANDARIN_SENTENCE_TEMPLATES,
  "zh-HK": CANTONESE_SENTENCE_TEMPLATES,
};

/**
 * Get sentence template for a phrase in the specified language
 */
export function getSentenceTemplate(
  phrase: string,
  language: SupportedLanguage = DEFAULT_LANGUAGE,
): string | undefined {
  const normalizedPhrase = phrase.toLowerCase().trim();
  const templates = LANGUAGE_TEMPLATES[language] || ENGLISH_SENTENCE_TEMPLATES;

  // Try language-specific template first, fall back to English if not found
  return (
    templates[normalizedPhrase] || ENGLISH_SENTENCE_TEMPLATES[normalizedPhrase]
  );
}

/**
 * Check if a sentence template exists for a phrase
 */
export function hasSentenceTemplate(phrase: string): boolean {
  const normalizedPhrase = phrase.toLowerCase().trim();
  return normalizedPhrase in ENGLISH_SENTENCE_TEMPLATES;
}

/**
 * Legacy export for backward compatibility
 * @deprecated Use getSentenceTemplate(phrase, language) instead
 */
export const SENTENCE_TEMPLATES = ENGLISH_SENTENCE_TEMPLATES;
