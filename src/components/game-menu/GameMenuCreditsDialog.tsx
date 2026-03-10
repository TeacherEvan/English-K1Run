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

export const GameMenuCreditsDialog = memo(() => {
    const { t } = useTranslation();

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    variant="link"
                    size="sm"
                    className="text-muted-foreground/60 h-auto p-0 text-xs mt-2"
                    data-testid="credits-button"
                >
                    {t("menu.credits.title")}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="text-2xl flex items-center gap-2">
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
