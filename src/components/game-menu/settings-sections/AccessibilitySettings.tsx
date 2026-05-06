import { memo, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSettings } from "../../../context/settings-context";
import {
    isAudioDescriptionsEnabled,
    setAudioDescriptionsEnabled,
} from "../../../lib/audio/audio-accessibility";
import { Button } from "../../ui/button";
import {
    MENU_SECTION_BODY_CLASS,
    MENU_SECTION_BODY_STYLE,
    MENU_SECTION_SURFACE_CLASS,
    MENU_SECTION_SURFACE_STYLE,
    MENU_SECTION_TITLE_CLASS,
    MENU_SECTION_TITLE_STYLE,
    MENU_SETTINGS_CONTROL_CLASS,
    MENU_SETTINGS_COPY_CLASS,
    MENU_SETTINGS_ROW_CLASS,
} from "../menu-surface-theme";

export const AccessibilitySettings = memo(() => {
    const { t } = useTranslation();
    const { highContrast, reducedMotion, setHighContrast, setReducedMotion } =
        useSettings();
    const [audioDescriptions, setAudioDescriptions] = useState(
        isAudioDescriptionsEnabled(),
    );

    useEffect(() => {
        const handleStorage = (event: StorageEvent) => {
            if (event.key === "k1run_audio_descriptions") {
                setAudioDescriptions(isAudioDescriptionsEnabled());
            }
        };

        window.addEventListener("storage", handleStorage);
        return () => window.removeEventListener("storage", handleStorage);
    }, []);

    const toggleAudioDescriptions = () => {
        const next = !audioDescriptions;
        setAudioDescriptionsEnabled(next);
        setAudioDescriptions(next);
    };

    return (
        <div className="space-y-4">
            <div className={MENU_SECTION_SURFACE_CLASS} style={MENU_SECTION_SURFACE_STYLE}>
                <div className={MENU_SETTINGS_ROW_CLASS}>
                    <div className={MENU_SETTINGS_COPY_CLASS}>
                        <h4 className={MENU_SECTION_TITLE_CLASS} style={MENU_SECTION_TITLE_STYLE}>{t("settings.accessibility.highContrastTitle")}</h4>
                        <p className={MENU_SECTION_BODY_CLASS} style={MENU_SECTION_BODY_STYLE}>
                            {t("settings.accessibility.highContrastDescription")}
                        </p>
                    </div>
                    <Button
                        variant={highContrast ? "default" : "outline"}
                        aria-pressed={highContrast}
                        onClick={() => setHighContrast(!highContrast)}
                        className={MENU_SETTINGS_CONTROL_CLASS}
                    >
                        {highContrast ? t("common.on") : t("common.off")}
                    </Button>
                </div>
            </div>
            <div className={MENU_SECTION_SURFACE_CLASS} style={MENU_SECTION_SURFACE_STYLE}>
                <div className={MENU_SETTINGS_ROW_CLASS}>
                    <div className={MENU_SETTINGS_COPY_CLASS}>
                        <h4 className={MENU_SECTION_TITLE_CLASS} style={MENU_SECTION_TITLE_STYLE}>{t("settings.accessibility.reducedMotionTitle")}</h4>
                        <p className={MENU_SECTION_BODY_CLASS} style={MENU_SECTION_BODY_STYLE}>
                            {t("settings.accessibility.reducedMotionDescription")}
                        </p>
                    </div>
                    <Button
                        variant={reducedMotion ? "default" : "outline"}
                        aria-pressed={reducedMotion}
                        onClick={() => setReducedMotion(!reducedMotion)}
                        className={MENU_SETTINGS_CONTROL_CLASS}
                    >
                        {reducedMotion ? t("common.on") : t("common.off")}
                    </Button>
                </div>
            </div>
            <div className={MENU_SECTION_SURFACE_CLASS} style={MENU_SECTION_SURFACE_STYLE}>
                <div className={MENU_SETTINGS_ROW_CLASS}>
                    <div className={MENU_SETTINGS_COPY_CLASS}>
                        <h4 className={MENU_SECTION_TITLE_CLASS} style={MENU_SECTION_TITLE_STYLE}>{t("settings.accessibility.audioDescriptionsTitle")}</h4>
                        <p className={MENU_SECTION_BODY_CLASS} style={MENU_SECTION_BODY_STYLE}>
                            {t("settings.accessibility.audioDescriptionsDescription")}
                        </p>
                    </div>
                    <Button
                        variant={audioDescriptions ? "default" : "outline"}
                        aria-pressed={audioDescriptions}
                        onClick={toggleAudioDescriptions}
                        className={MENU_SETTINGS_CONTROL_CLASS}
                    >
                        {audioDescriptions ? t("common.on") : t("common.off")}
                    </Button>
                </div>
            </div>
        </div>
    );
});

AccessibilitySettings.displayName = "AccessibilitySettings";
