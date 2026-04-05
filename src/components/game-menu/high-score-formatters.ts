import { LANGUAGE_CONFIGS } from "@/lib/constants/language-config";

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
