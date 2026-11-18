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
                {/*
                    Exit carried the same mass and saturation as the primary
                    "Start Game" action (76px tall, full-strength red), so the
                    loudest control on a kindergarten menu was the one that
                    ends the session. It keeps its destructive identity and its
                    confirmation dialog, but now reads as a quiet tertiary row.
                */}
                <Button
                    variant="destructive"
                    size="lg"
                    className="menu-support-action mt-1 h-14 justify-start gap-4 rounded-3xl border border-red-200 bg-red-50/80 px-5 text-base font-semibold text-red-800 shadow-none hover:-translate-y-0.5 hover:border-red-300 hover:bg-red-100 hover:shadow-none active:shadow-none dark:border-red-200 dark:bg-red-50/80 dark:text-red-800"
                    onClick={handleExit}
                    data-testid="exit-button"
                >
                    <MenuActionButtonContent
                        icon={<LogOutIcon className="w-5 h-5" />}
                        subtitleClassName="mt-1 text-sm font-medium text-red-700/80"
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
