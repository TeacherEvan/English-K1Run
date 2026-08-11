import type { SupportedLanguage } from "@/lib/constants/language-config";
import enTranslations from "@/locales/en.json";
import frTranslations from "@/locales/fr.json";
import jaTranslations from "@/locales/ja.json";
import thTranslations from "@/locales/th.json";
import zhCnTranslations from "@/locales/zh-CN.json";
import zhHkTranslations from "@/locales/zh-HK.json";

interface TranslationDict {
  [key: string]: TranslationNode;
}

type TranslationNode = string | TranslationDict;

export type MenuActionLabelKey =
  | "game.startGame"
  | "game.playAllLevels"
  | "game.levelSelect"
  | "game.settings"
  | "game.exit";

const TRANSLATIONS: Record<SupportedLanguage, TranslationNode> = {
  en: enTranslations as TranslationNode,
  fr: frTranslations as TranslationNode,
  ja: jaTranslations as TranslationNode,
  th: thTranslations as TranslationNode,
  "zh-CN": zhCnTranslations as TranslationNode,
  "zh-HK": zhHkTranslations as TranslationNode,
};

const readTranslation = (
  tree: TranslationNode,
  key: MenuActionLabelKey,
): string | undefined => {
  const value = key
    .split(".")
    .reduce<TranslationNode | undefined>((current, segment) => {
      if (!current || typeof current === "string") return current;
      return current[segment];
    }, tree);

  return typeof value === "string" ? value : undefined;
};

export const getMenuActionLabel = (
  key: MenuActionLabelKey,
  gameplayLanguage: SupportedLanguage,
) => {
  const title = readTranslation(TRANSLATIONS.en, key) ?? key;
  if (gameplayLanguage === "en") {
    return { title, subtitle: undefined };
  }

  const subtitle = readTranslation(TRANSLATIONS[gameplayLanguage], key);
  return {
    title,
    subtitle: subtitle && subtitle !== title ? subtitle : undefined,
  };
};
