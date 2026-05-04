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
                <div className="space-y-4 rounded-[1.65rem] border border-[rgba(214,144,62,0.24)] bg-[linear-gradient(145deg,rgba(255,248,236,0.98),rgba(241,252,244,0.96)_56%,rgba(255,239,229,0.94))] p-5 shadow-[0_20px_42px_rgba(120,53,15,0.08)]">
                    <div className="space-y-1">
                        <h4 className="font-semibold leading-none text-[rgb(123,63,33)]">
                            {t("settings.controls.languageSectionTitle")}
                        </h4>
                        <p className="max-w-[34rem] text-sm text-[rgba(102,78,56,0.84)]">
                            {t("settings.controls.languageSectionDescription")}
                        </p>
                    </div>
                    <div className="grid gap-3">
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
