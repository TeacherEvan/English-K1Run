import { memo } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../../ui/button";
import { LanguageSelector } from "../../ui/language-selector";
import {
    MENU_SECTION_BODY_CLASS,
    MENU_SECTION_BODY_STYLE,
    MENU_SETTINGS_CONTROL_CLASS,
    MENU_SECTION_SURFACE_CLASS,
    MENU_SECTION_SURFACE_STYLE,
    MENU_SETTINGS_COPY_CLASS,
    MENU_SETTINGS_ROW_CLASS,
    MENU_SECTION_TITLE_CLASS,
    MENU_SECTION_TITLE_STYLE,
} from "../menu-surface-theme";

interface ControlSettingsProps {
    continuousMode: boolean;
    onToggleContinuousMode?: (enabled: boolean) => void;
}

export const ControlSettings = memo(
    ({ continuousMode, onToggleContinuousMode }: ControlSettingsProps) => {
        const { t } = useTranslation();

        return (
            <div className="space-y-4">
                <div className={`space-y-4 ${MENU_SECTION_SURFACE_CLASS}`} style={MENU_SECTION_SURFACE_STYLE}>
                    <div className="space-y-1">
                        <h4 className={MENU_SECTION_TITLE_CLASS} style={MENU_SECTION_TITLE_STYLE}>
                            {t("settings.controls.languageSectionTitle")}
                        </h4>
                        <p className={`max-w-136 ${MENU_SECTION_BODY_CLASS}`} style={MENU_SECTION_BODY_STYLE}>
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
                <div className={`flex items-center justify-between ${MENU_SECTION_SURFACE_CLASS}`} style={MENU_SECTION_SURFACE_STYLE}>
                    <div className={MENU_SETTINGS_ROW_CLASS}>
                    <div className={MENU_SETTINGS_COPY_CLASS}>
                        <h4 className={MENU_SECTION_TITLE_CLASS} style={MENU_SECTION_TITLE_STYLE}>
                            {t("game.continuousMode")}
                        </h4>
                        <p className={MENU_SECTION_BODY_CLASS} style={MENU_SECTION_BODY_STYLE}>
                            {t("settings.controls.continuousModeDescription")}
                        </p>
                    </div>
                    <Button
                        variant={continuousMode ? "default" : "outline"}
                        onClick={() => onToggleContinuousMode?.(!continuousMode)}
                        className={`${MENU_SETTINGS_CONTROL_CLASS} ${continuousMode ? "border-transparent text-primary-foreground" : ""}`.trim()}
                        aria-pressed={continuousMode}
                    >
                        {continuousMode ? t("common.on") : t("common.off")}
                    </Button>
                    </div>
                </div>
            </div>
        );
    },
);

ControlSettings.displayName = "ControlSettings";
