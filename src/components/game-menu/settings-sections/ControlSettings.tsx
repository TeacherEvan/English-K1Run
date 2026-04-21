import { memo } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../../ui/button";
import { LanguageSelector } from "../../ui/language-selector";

interface ControlSettingsProps {
    continuousMode: boolean;
    onToggleContinuousMode?: (enabled: boolean) => void;
}

export const ControlSettings = memo(
    ({ continuousMode, onToggleContinuousMode }: ControlSettingsProps) => {
        const { t } = useTranslation();

        return (
            <div className="space-y-4">
                <div className="space-y-4 rounded-lg border border-border/80 bg-card/95 p-4 shadow-sm">
                    <div className="space-y-1">
                        <h4 className="font-medium leading-none">
                            {t("settings.controls.languageSectionTitle")}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                            {t("settings.controls.languageSectionDescription")}
                        </p>
                    </div>
                    <LanguageSelector
                        className="w-full"
                        highlightVariant="sibling"
                        languageType="display"
                    />
                    <LanguageSelector
                        className="w-full"
                        highlightVariant="spotlight"
                        languageType="gameplay"
                    />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border/80 bg-card/95 p-4 shadow-sm">
                    <div className="space-y-1">
                        <h4 className="font-medium leading-none">
                            {t("game.continuousMode")}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                            {t("settings.controls.continuousModeDescription")}
                        </p>
                    </div>
                    <Button
                        variant={continuousMode ? "default" : "outline"}
                        onClick={() => onToggleContinuousMode?.(!continuousMode)}
                        className={continuousMode ? "bg-green-600 hover:bg-green-700" : ""}
                        aria-pressed={continuousMode}
                    >
                        {continuousMode ? t("common.on") : t("common.off")}
                    </Button>
                </div>
            </div>
        );
    },
);

ControlSettings.displayName = "ControlSettings";
