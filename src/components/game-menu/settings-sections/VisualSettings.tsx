import { memo } from "react";
import { useTranslation } from "react-i18next";
import type { ResolutionScale, Theme } from "../../../context/settings-context";
import { useSettings } from "../../../context/settings-context";
import { Button } from "../../ui/button";
import { DISPLAY_SCALE_OPTIONS } from "../constants";

interface VisualSettingsProps {
    resolutionScale: ResolutionScale;
    setResolutionScale: (scale: ResolutionScale) => void;
}

const THEME_OPTIONS: Array<{ id: Theme; label: string }> = [
    { id: "colorful", label: "settings.visual.themeOptions.colorful" },
    { id: "light", label: "settings.visual.themeOptions.light" },
    { id: "dark", label: "settings.visual.themeOptions.dark" },
];

export const VisualSettings = memo(
    ({ resolutionScale, setResolutionScale }: VisualSettingsProps) => {
        const { t } = useTranslation();
        const { theme, setTheme } = useSettings();

        return (
            <div className="space-y-4">
                <div className="space-y-2">
                    <h4 className="font-medium leading-none">{t("settings.visual.themeTitle")}</h4>
                    <p className="text-sm text-muted-foreground">
                        {t("settings.visual.themeDescription")}
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                        {THEME_OPTIONS.map((option) => (
                            <Button
                                key={option.id}
                                variant={theme === option.id ? "default" : "outline"}
                                onClick={() => setTheme(option.id)}
                                aria-pressed={theme === option.id}
                            >
                                {t(option.label)}
                            </Button>
                        ))}
                    </div>
                </div>
                <div className="space-y-2">
                    <h4 className="font-medium leading-none">{t("settings.visual.displayScaleTitle")}</h4>
                    <p className="text-sm text-muted-foreground">
                        {t("settings.visual.displayScaleDescription")}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                        {DISPLAY_SCALE_OPTIONS.map((option) => (
                            <Button
                                key={option.id}
                                variant={
                                    resolutionScale === option.id ? "default" : "outline"
                                }
                                onClick={() => setResolutionScale(option.id)}
                                aria-pressed={resolutionScale === option.id}
                            >
                                {t(`settings.visual.scaleOptions.${option.id}`)}
                            </Button>
                        ))}
                    </div>
                </div>
            </div>
        );
    },
);

VisualSettings.displayName = "VisualSettings";
