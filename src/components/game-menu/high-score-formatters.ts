import { LANGUAGE_CONFIGS } from "@/lib/constants/language-config";

export const normalizeBestTargetTotal = (value: number) => {
  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }

  return Math.trunc(value);
};

export const formatBestTargetTotal = (
  value: number,
  language: keyof typeof LANGUAGE_CONFIGS,
) => {
  const locale = LANGUAGE_CONFIGS[language]?.fallbackLocale ?? "en-GB";

  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
  }).format(normalizeBestTargetTotal(value));
};

export const getHighScoreLanguageLabel = (
  language: keyof typeof LANGUAGE_CONFIGS,
) => {
  const config = LANGUAGE_CONFIGS[language];
  if (!config) {
    return language;
  }
  return config.name === config.nativeName
    ? config.name
    : `${config.name} (${config.nativeName})`;
};

export const formatHighScoreTimestamp = (achievedAt: string) => {
  const parsed = new Date(achievedAt);
  if (Number.isNaN(parsed.getTime())) {
    return achievedAt;
  }
  return parsed.toISOString().replace("T", " ").slice(0, 16) + " UTC";
};
