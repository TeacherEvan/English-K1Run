import type { ChallengeModeHighScoreEntry } from "@/lib/challenge-mode-high-scores";
import { useTranslation } from "react-i18next";
import {
  formatHighScoreTimestamp,
  getHighScoreLanguageLabel,
} from "./high-score-formatters";

interface HighScoresListProps {
  highScores: ChallengeModeHighScoreEntry[];
}

export function HighScoresList({ highScores }: HighScoresListProps) {
  const { t } = useTranslation();

  if (highScores.length === 0) {
    return (
      <div
        data-testid="high-scores-empty"
        className="rounded-[1.6rem] border border-dashed border-amber-300/80 bg-amber-50/70 px-5 py-5 text-slate-700"
      >
        <p className="text-sm font-semibold text-slate-900">{t("game.highScoresEmpty")}</p>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          {t("game.highScoresEmptyGuide", {
            defaultValue:
              "Start Challenge Mode from the home screen, clear as many targets as you can, and your first score will appear here.",
          })}
        </p>
      </div>
    );
  }

  return (
    <ol className="space-y-3" data-testid="high-scores-list">
      {highScores.map((entry, index) => (
        <li
          key={`${entry.score}-${entry.language}-${entry.achievedAt}-${index}`}
          data-testid="high-scores-row"
          className="rounded-2xl border border-slate-200 bg-white/85 px-4 py-3 shadow-sm"
        >
          <div className="flex items-center justify-between gap-3">
            <span className="text-xl font-bold text-slate-900">{entry.score}</span>
            <span className="text-sm font-semibold text-amber-700">
              {t("game.targetsDestroyed")}
            </span>
          </div>
          <dl className="mt-2 grid gap-1 text-sm text-slate-700">
            <div>
              <dt className="inline font-semibold">{t("game.languageUsed")}: </dt>
              <dd className="inline">{getHighScoreLanguageLabel(entry.language)}</dd>
            </div>
            <div>
              <dt className="inline font-semibold">{t("game.achievedAt")}: </dt>
              <dd className="inline">{formatHighScoreTimestamp(entry.achievedAt)}</dd>
            </div>
          </dl>
        </li>
      ))}
    </ol>
  );
}
