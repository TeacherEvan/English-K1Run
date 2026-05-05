import { memo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSettings } from "../../context/settings-context";
import { Button } from "../ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "../ui/dialog";
import { LogOutIcon } from "./icons";
import { getMenuActionLabel } from "./menu-action-labels";
import { MenuActionButtonContent } from "./MenuActionButtonContent";

interface GameMenuExitDialogProps {
    onResetGame?: () => void;
}

export const GameMenuExitDialog = memo(
    ({ onResetGame }: GameMenuExitDialogProps) => {
        const { t } = useTranslation();
        const { gameplayLanguage } = useSettings();
        const [showExitDialog, setShowExitDialog] = useState(false);
        const exitLabel = getMenuActionLabel("game.exit", gameplayLanguage);

        const handleExit = () => {
            setShowExitDialog(true);
        };

        const confirmExit = () => {
            setShowExitDialog(false);
            onResetGame?.();
            try {
                window.close();
            } catch (error) {
                console.error("[GameMenuExitDialog] Failed to close window", error);
            }
        };

        return (
            <>
                <Button
                    variant="outline"
                    size="lg"
                    className="menu-support-action mt-1 h-[4.4rem] w-full min-w-0 justify-start gap-4 rounded-[1.4rem] border border-[rgba(212,156,84,0.24)] bg-[rgba(255,248,235,0.96)] px-5 text-base font-semibold text-[rgb(122,62,34)] shadow-[0_10px_18px_rgba(120,87,23,0.08)] hover:-translate-y-0.5 hover:bg-[rgba(252,240,220,0.98)] hover:shadow-[0_14px_22px_rgba(120,87,23,0.12)]"
                    onClick={handleExit}
                    data-testid="exit-button"
                >
                    <MenuActionButtonContent
                        icon={<LogOutIcon className="w-5 h-5" />}
                        subtitleClassName="mt-1 text-sm font-medium text-white/78"
                        textClassName="menu-action-copy flex flex-col items-start leading-tight"
                        title={exitLabel.title}
                        subtitle={exitLabel.subtitle}
                    />
                </Button>

                <Dialog open={showExitDialog} onOpenChange={setShowExitDialog}>
                    <DialogContent className="menu-compact-dialog sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-2xl flex items-center gap-2 text-destructive">
                                <LogOutIcon className="w-6 h-6" />
                                {t("menu.exitDialog.title")}
                            </DialogTitle>
                            <DialogDescription>
                                {t("menu.exitDialog.description")}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex gap-4 justify-end mt-6">
                            <Button
                                variant="outline"
                                onClick={() => setShowExitDialog(false)}
                                autoFocus
                            >
                                {t("common.cancel")}
                            </Button>
                            <Button variant="destructive" onClick={confirmExit}>
                                {t("game.exit")}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </>
        );
    }
);

GameMenuExitDialog.displayName = "GameMenuExitDialog";
