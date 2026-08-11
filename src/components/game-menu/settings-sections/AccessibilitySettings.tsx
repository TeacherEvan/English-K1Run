import { memo, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSettings } from "../../../context/settings-context";
import {
    isAudioDescriptionsEnabled,
    setAudioDescriptionsEnabled,
} from "../../../lib/audio/audio-accessibility";
import { Button } from "../../ui/button";

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
            <div className="flex items-center justify-between">
                <div>
                    <h4 className="font-medium leading-none">{t("settings.accessibility.highContrastTitle")}</h4>
                    <p className="text-sm text-muted-foreground">
                        {t("settings.accessibility.highContrastDescription")}
                    </p>
                </div>
                <Button
                    variant={highContrast ? "default" : "outline"}
                    aria-pressed={highContrast}
                    onClick={() => setHighContrast(!highContrast)}
                >
                    {highContrast ? t("common.on") : t("common.off")}
                </Button>
            </div>
            <div className="flex items-center justify-between">
                <div>
                    <h4 className="font-medium leading-none">{t("settings.accessibility.reducedMotionTitle")}</h4>
                    <p className="text-sm text-muted-foreground">
                        {t("settings.accessibility.reducedMotionDescription")}
                    </p>
                </div>
                <Button
                    variant={reducedMotion ? "default" : "outline"}
                    aria-pressed={reducedMotion}
                    onClick={() => setReducedMotion(!reducedMotion)}
                >
                    {reducedMotion ? t("common.on") : t("common.off")}
                </Button>
            </div>
            <div className="flex items-center justify-between">
                <div>
                    <h4 className="font-medium leading-none">{t("settings.accessibility.audioDescriptionsTitle")}</h4>
                    <p className="text-sm text-muted-foreground">
                        {t("settings.accessibility.audioDescriptionsDescription")}
                    </p>
                </div>
                <Button
                    variant={audioDescriptions ? "default" : "outline"}
                    aria-pressed={audioDescriptions}
                    onClick={toggleAudioDescriptions}
                >
                    {audioDescriptions ? t("common.on") : t("common.off")}
                </Button>
            </div>
        </div>
    );
});

AccessibilitySettings.displayName = "AccessibilitySettings";
