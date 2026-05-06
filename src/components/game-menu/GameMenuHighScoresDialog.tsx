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
import {
  MENU_ACTION_TEXT_CLASS,
  MENU_DIALOG_CLASS,
  MENU_DIALOG_DESCRIPTION_CLASS,
  MENU_DIALOG_DESCRIPTION_STYLE,
  MENU_DIALOG_HEADER_TITLE_CLASS,
  MENU_DIALOG_STYLE,
  MENU_DIALOG_TITLE_STYLE,
  MENU_UTILITY_ACTION_CLASS,
  MENU_UTILITY_ACTION_STYLE,
} from "./menu-surface-theme";

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
          className={MENU_UTILITY_ACTION_CLASS}
          style={MENU_UTILITY_ACTION_STYLE}
          data-testid="high-scores-button"
        >
            <span className="flex min-w-0 items-center gap-4">
            <span className="menu-action-icon-shell menu-action-icon-shell--challenge">
              <TrophyIcon className="h-6 w-6 text-amber-600" />
            </span>
              <span className={MENU_ACTION_TEXT_CLASS}>
              <span className="font-semibold">{t("game.highScores")}</span>
                <span
                  className="mt-1 max-w-full overflow-hidden text-ellipsis whitespace-normal text-sm font-medium text-slate-600"
                  style={{ overflowWrap: "anywhere" }}
                >
                {t("game.highScoresTitle")}
              </span>
            </span>
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent
        className={`${MENU_DIALOG_CLASS} sm:max-w-xl`}
        style={MENU_DIALOG_STYLE}
        data-testid="high-scores-dialog"
      >
        <DialogHeader>
          <DialogTitle className={MENU_DIALOG_HEADER_TITLE_CLASS} style={MENU_DIALOG_TITLE_STYLE}>
            <TrophyIcon className="h-6 w-6 text-amber-500" />
            {t("game.highScoresTitle")}
          </DialogTitle>
          <DialogDescription className={MENU_DIALOG_DESCRIPTION_CLASS} style={MENU_DIALOG_DESCRIPTION_STYLE}>
            {t("game.targetsDestroyed")}
          </DialogDescription>
        </DialogHeader>
        <HighScoresList highScores={highScores} />
      </DialogContent>
    </Dialog>
  );
}
