import {
  isSupportedLanguage,
  type SupportedLanguage,
} from "@/lib/constants/language-config";

export interface ChallengeModeHighScoreEntry {
  score: number;
  language: SupportedLanguage;
  achievedAt: string;
}

const STORAGE_KEY = "challengeModeHighScores";

const isIsoDateString = (value: unknown): value is string => {
  if (typeof value !== "string") return false;
  return !Number.isNaN(Date.parse(value));
};

const isHighScoreEntry = (
  value: unknown,
): value is ChallengeModeHighScoreEntry => {
  if (!value || typeof value !== "object") return false;
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.score === "number" &&
    Number.isFinite(entry.score) &&
    isSupportedLanguage(String(entry.language)) &&
    isIsoDateString(entry.achievedAt)
  );
};

const sortEntries = (entries: ChallengeModeHighScoreEntry[]) =>
  [...entries].sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score;
    }
    return right.achievedAt.localeCompare(left.achievedAt);
  });

export const readChallengeModeHighScores =
  (): ChallengeModeHighScoreEntry[] => {
    if (typeof localStorage === "undefined") return [];

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      const parsed = JSON.parse(stored) as unknown;
      if (!Array.isArray(parsed)) return [];
      return sortEntries(parsed.filter(isHighScoreEntry));
    } catch {
      return [];
    }
  };

export const recordChallengeModeHighScore = (
  entry: ChallengeModeHighScoreEntry,
): ChallengeModeHighScoreEntry[] => {
  const nextEntries = sortEntries([...readChallengeModeHighScores(), entry]);

  if (typeof localStorage !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextEntries));
  }

  return nextEntries;
};

export const getBestChallengeModeScore = (): number | null => {
  const [bestEntry] = readChallengeModeHighScores();
  return bestEntry?.score ?? null;
};
