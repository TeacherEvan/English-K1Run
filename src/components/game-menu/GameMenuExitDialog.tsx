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
    MENU_UTILITY_SUBTITLE_STYLE,
} from "./menu-surface-theme";

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
                    className={`mt-1 ${MENU_UTILITY_ACTION_CLASS}`}
                    style={MENU_UTILITY_ACTION_STYLE}
                    onClick={handleExit}
                    data-testid="exit-button"
                >
                    <MenuActionButtonContent
                        icon={<LogOutIcon className="w-5 h-5" />}
                        subtitleClassName="mt-1 text-sm font-medium"
                        subtitleStyle={MENU_UTILITY_SUBTITLE_STYLE}
                        textClassName={MENU_ACTION_TEXT_CLASS}
                        title={exitLabel.title}
                        subtitle={exitLabel.subtitle}
                    />
                </Button>

                <Dialog open={showExitDialog} onOpenChange={setShowExitDialog}>
                    <DialogContent className={`menu-compact-dialog ${MENU_DIALOG_CLASS} sm:max-w-md`} style={MENU_DIALOG_STYLE}>
                        <DialogHeader>
                            <DialogTitle className={MENU_DIALOG_HEADER_TITLE_CLASS} style={MENU_DIALOG_TITLE_STYLE}>
                                <LogOutIcon className="w-6 h-6" />
                                {t("menu.exitDialog.title")}
                            </DialogTitle>
                            <DialogDescription className={MENU_DIALOG_DESCRIPTION_CLASS} style={MENU_DIALOG_DESCRIPTION_STYLE}>
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
