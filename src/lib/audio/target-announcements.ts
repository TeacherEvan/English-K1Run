/**
 * Target Announcement Helpers
 *
 * Provides sentence-based target prompts with safeguards to avoid
 * single-word audio clips.
 */

import { getSentenceTemplate } from "../constants/sentence-templates";
import type { SupportedLanguage } from "../constants/language-config";
import { speechSynthesizer } from "./speech-synthesizer";

const MIN_WORD_COUNT = 2;

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

const ensureSentence = (text: string, fallbackName: string) => {
  const normalized = normalizeText(text);
  if (!normalized) return buildFallbackSentence(fallbackName);
  if (isSingleWord(normalized)) return buildFallbackSentence(fallbackName);
  const wordCount = normalized.split(" ").length;
  if (wordCount < MIN_WORD_COUNT) return buildFallbackSentence(fallbackName);
  return normalized.endsWith(".") ? normalized : `${normalized}.`;
};

export const getTargetSentence = (
  targetName: string,
  language: SupportedLanguage,
): string => {
  const template = getSentenceTemplate(targetName, language) || "";
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