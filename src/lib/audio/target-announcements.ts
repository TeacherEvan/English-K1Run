/**
 * Target Announcement Helpers
 *
 * Provides sentence-based target prompts with safeguards to avoid
 * single-word audio clips.
 */

import type { SupportedLanguage } from "../constants/language-config";
import { getLocalizedSentenceTemplate } from "../constants/sentence-templates";
import { speechSynthesizer } from "./speech-synthesizer";

const MIN_WORD_COUNT = 2;
const NON_SPACE_SENTENCE_PATTERN =
  /[\u0E00-\u0E7F\u3040-\u30FF\u3400-\u9FFF\uF900-\uFAFF]/u;

const normalizeText = (text: string) => text.replace(/\s+/g, " ").trim();

const isSingleWord = (text: string) => {
  const normalized = normalizeText(text);
  if (!normalized) return true;
  return !normalized.includes(" ");
};

const buildFallbackSentence = (name: string) => {
  const normalized = normalizeText(name);
  if (!normalized) return "";
  if (/^\d+$/.test(normalized)) {
    return `The number is ${normalized}.`;
  }
  if (/^[A-Za-z]$/.test(normalized)) {
    return `Find the letter ${normalized.toUpperCase()}.`;
  }
  return `Find the ${normalized}.`;
};

const usesNonSpaceScript = (text: string) =>
  NON_SPACE_SENTENCE_PATTERN.test(text);

const ensureSentence = (text: string, fallbackName: string) => {
  const normalized = normalizeText(text);
  if (!normalized) return buildFallbackSentence(fallbackName);
  const nonSpaceScript = usesNonSpaceScript(normalized);
  if (isSingleWord(normalized) && !nonSpaceScript) {
    return buildFallbackSentence(fallbackName);
  }
  const wordCount = normalized.split(" ").length;
  if (wordCount < MIN_WORD_COUNT && !nonSpaceScript) {
    return buildFallbackSentence(fallbackName);
  }
  const endsWithPunctuation = /[.!?。！？]$/.test(normalized);
  if (nonSpaceScript) {
    return normalized;
  }
  return endsWithPunctuation ? normalized : `${normalized}.`;
};

export const getTargetSentence = (
  targetName: string,
  language: SupportedLanguage,
): string => {
  const template = getLocalizedSentenceTemplate(targetName, language) || "";
  if (!template && language !== "en") {
    if (import.meta.env.DEV) {
      console.warn(
        `[TargetAnnouncements] Missing ${language} sentence template for "${targetName}"; skipping English audio fallback.`,
      );
    }
    return "";
  }
  return ensureSentence(template, targetName);
};

export const playTargetSentence = async (
  targetName: string,
  language: SupportedLanguage,
): Promise<string> => {
  const sentence = getTargetSentence(targetName, language);
  if (!sentence) return "";
  await speechSynthesizer.speakAsync(sentence, { langCode: language });
  return sentence;
};
