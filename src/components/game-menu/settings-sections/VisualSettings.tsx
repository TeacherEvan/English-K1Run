import { memo } from "react";
import { useTranslation } from "react-i18next";
import type { ResolutionScale, Theme } from "../../../context/settings-context";
import { useSettings } from "../../../context/settings-context";
import { Button } from "../../ui/button";
import { DISPLAY_SCALE_OPTIONS } from "../constants";
import {
    MENU_OPTION_GRID_THREE_CLASS,
    MENU_OPTION_GRID_TWO_CLASS,
    MENU_SECTION_BODY_CLASS,
    MENU_SECTION_BODY_STYLE,
    MENU_SETTINGS_CONTROL_CLASS,
    MENU_SECTION_SURFACE_CLASS,
    MENU_SECTION_SURFACE_STYLE,
    MENU_SECTION_TITLE_CLASS,
    MENU_SECTION_TITLE_STYLE,
} from "../menu-surface-theme";

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
                <div className={`space-y-3 ${MENU_SECTION_SURFACE_CLASS}`} style={MENU_SECTION_SURFACE_STYLE}>
                    <h4 className={MENU_SECTION_TITLE_CLASS} style={MENU_SECTION_TITLE_STYLE}>{t("settings.visual.themeTitle")}</h4>
                    <p className={MENU_SECTION_BODY_CLASS} style={MENU_SECTION_BODY_STYLE}>
                        {t("settings.visual.themeDescription")}
                    </p>
                    <div className={MENU_OPTION_GRID_THREE_CLASS}>
                        {THEME_OPTIONS.map((option) => (
                            <Button
                                key={option.id}
                                variant={theme === option.id ? "default" : "outline"}
                                onClick={() => setTheme(option.id)}
                                aria-pressed={theme === option.id}
                                className={MENU_SETTINGS_CONTROL_CLASS}
                            >
                                {t(option.label)}
                            </Button>
                        ))}
                    </div>
                </div>
                <div className={`space-y-3 ${MENU_SECTION_SURFACE_CLASS}`} style={MENU_SECTION_SURFACE_STYLE}>
                    <h4 className={MENU_SECTION_TITLE_CLASS} style={MENU_SECTION_TITLE_STYLE}>{t("settings.visual.displayScaleTitle")}</h4>
                    <p className={MENU_SECTION_BODY_CLASS} style={MENU_SECTION_BODY_STYLE}>
                        {t("settings.visual.displayScaleDescription")}
                    </p>
                    <div className={MENU_OPTION_GRID_TWO_CLASS}>
                        {DISPLAY_SCALE_OPTIONS.map((option) => (
                            <Button
                                key={option.id}
                                variant={
                                    resolutionScale === option.id ? "default" : "outline"
                                }
                                onClick={() => setResolutionScale(option.id)}
                                aria-pressed={resolutionScale === option.id}
                                className={MENU_SETTINGS_CONTROL_CLASS}
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
