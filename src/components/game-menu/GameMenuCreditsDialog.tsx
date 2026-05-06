import { memo } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "../ui/dialog";
import { InfoIcon } from "./icons";
import {
    MENU_DIALOG_CLASS,
    MENU_DIALOG_HEADER_TITLE_CLASS,
    MENU_DIALOG_STYLE,
    MENU_DIALOG_TITLE_STYLE,
    MENU_SUPPORT_LINK_CLASS,
    MENU_SUPPORT_LINK_STYLE,
} from "./menu-surface-theme";

export const GameMenuCreditsDialog = memo(() => {
    const { t } = useTranslation();

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    variant="link"
                    size="sm"
                    className={MENU_SUPPORT_LINK_CLASS}
                    style={MENU_SUPPORT_LINK_STYLE}
                    data-testid="credits-button"
                >
                    {t("menu.credits.title")}
                </Button>
            </DialogTrigger>
            <DialogContent className={`menu-compact-dialog ${MENU_DIALOG_CLASS} sm:max-w-lg`} style={MENU_DIALOG_STYLE}>
                <DialogHeader>
                    <DialogTitle className={MENU_DIALOG_HEADER_TITLE_CLASS} style={MENU_DIALOG_TITLE_STYLE}>
                        <InfoIcon className="w-6 h-6" />
                        {t("menu.credits.title")}
                    </DialogTitle>
                </DialogHeader>
                <div className="py-8 text-center space-y-6">
                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground uppercase tracking-widest">
                            {t("menu.credits.createdBy")}
                        </p>
                        <h3 className="text-2xl font-bold text-primary">TEACHER EVAN</h3>
                    </div>
                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground uppercase tracking-widest">
                            {t("menu.credits.inAssociationWith")}
                        </p>
                        <h3 className="text-xl font-bold text-orange-500">
                            SANGSOM KINDERGARTEN
                        </h3>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-xl">
                        <p className="text-sm font-semibold mb-2">{t("menu.credits.specialThanks")}</p>
                        <p className="text-lg">TEACHER MIKE AND TEACHER LEE</p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
});

GameMenuCreditsDialog.displayName = "GameMenuCreditsDialog";
