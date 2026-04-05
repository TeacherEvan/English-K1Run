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
          className="menu-support-action h-19 justify-start gap-4 rounded-3xl border border-slate-200 bg-[#fbf6ea] px-6 text-lg font-semibold text-slate-900 shadow-[0_10px_18px_rgba(71,85,105,0.08)] hover:-translate-y-0.5 hover:bg-[#f4ecd8] hover:shadow-[0_16px_24px_rgba(71,85,105,0.12)]"
          data-testid="high-scores-button"
        >
          <span className="flex items-center gap-4">
            <span className="menu-action-icon-shell menu-action-icon-shell--challenge">
              <TrophyIcon className="h-6 w-6 text-amber-600" />
            </span>
            <span className="flex flex-col items-start leading-tight">
              <span className="font-semibold">{t("game.highScores")}</span>
              <span className="mt-1 text-sm font-medium text-slate-600">
                {t("game.highScoresTitle")}
              </span>
            </span>
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent
        className="border-border/80 bg-background/98 shadow-2xl backdrop-blur-sm sm:max-w-xl"
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
