/**
 * Phonics Module
 *
 * Plays isolated initial-letter phonics independently from target sentences.
 */

import type { SupportedLanguage } from "../constants/language-config";
import { speechSynthesizer } from "./speech-synthesizer";

const PHONICS_SOUNDS: Record<string, string> = {
  a: "ah",
  b: "buh",
  c: "kuh",
  d: "duh",
  e: "eh",
  f: "fuh",
  g: "guh",
  h: "huh",
  i: "ih",
  j: "juh",
  k: "kuh",
  l: "luh",
  m: "muh",
  n: "nuh",
  o: "oh",
  p: "puh",
  q: "kwuh",
  r: "ruh",
  s: "suh",
  t: "tuh",
  u: "uh",
  v: "vuh",
  w: "wuh",
  x: "ks",
  y: "yuh",
  z: "zuh",
};

const getInitialLetter = (targetName: string) => {
  const normalized = targetName.trim().toLowerCase();
  if (!normalized) return "";
  const firstChar = normalized[0];
  return /^[a-z]$/.test(firstChar) ? firstChar : "";
};

const buildPhonicsSentence = (letter: string) => {
  const sound = PHONICS_SOUNDS[letter] || letter;
  return `The letter ${letter.toUpperCase()} makes the ${sound} sound.`;
};

export const playTargetPhonics = async (
  targetName: string,
  language: SupportedLanguage,
): Promise<void> => {
  const letter = getInitialLetter(targetName);
  if (!letter) return;
  const sentence = buildPhonicsSentence(letter);
  await speechSynthesizer.speakAsync(sentence, { langCode: language });
};
