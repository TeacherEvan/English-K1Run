import type { ChallengeModeHighScoreEntry } from "@/lib/challenge-mode-high-scores";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { TrophyIcon } from "./icons";
import { HighScoresList } from "./HighScoresList";
import { useTranslation } from "react-i18next";

interface GameMenuHighScoresDialogProps {
  highScores: ChallengeModeHighScoreEntry[];
}

export function GameMenuHighScoresDialog({
  highScores,
}: GameMenuHighScoresDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="lg"
          className="menu-support-action h-[4.4rem] w-full min-w-0 justify-start gap-4 rounded-[1.4rem] border border-[rgba(212,156,84,0.24)] bg-[rgba(255,248,235,0.96)] px-5 text-base font-semibold text-[rgb(63,52,41)] shadow-[0_10px_18px_rgba(120,87,23,0.08)] hover:-translate-y-0.5 hover:bg-[rgba(252,240,220,0.98)] hover:shadow-[0_14px_22px_rgba(120,87,23,0.12)]"
          data-testid="high-scores-button"
        >
            <span className="flex min-w-0 items-center gap-4">
            <span className="menu-action-icon-shell menu-action-icon-shell--challenge">
              <TrophyIcon className="h-6 w-6 text-amber-600" />
            </span>
              <span className="flex min-w-0 flex-1 flex-col items-start leading-tight">
              <span className="font-semibold">{t("game.highScores")}</span>
                <span className="mt-1 max-w-full overflow-hidden text-ellipsis text-sm font-medium text-slate-600 [overflow-wrap:anywhere]">
                {t("game.highScoresTitle")}
              </span>
            </span>
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent
        className="border-[rgba(212,156,84,0.24)] bg-[linear-gradient(180deg,rgba(255,252,246,0.99),rgba(249,245,236,0.98))] shadow-2xl sm:max-w-xl"
        data-testid="high-scores-dialog"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <TrophyIcon className="h-6 w-6 text-amber-500" />
            {t("game.highScoresTitle")}
          </DialogTitle>
          <DialogDescription>
            {t("game.targetsDestroyed")}
          </DialogDescription>
        </DialogHeader>
        <HighScoresList highScores={highScores} />
      </DialogContent>
    </Dialog>
  );
}
