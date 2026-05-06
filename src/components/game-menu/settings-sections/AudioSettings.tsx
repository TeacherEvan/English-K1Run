import { memo } from "react";
import { useTranslation } from "react-i18next";
import { useSettings } from "../../../context/settings-context";
import { Button } from "../../ui/button";
import { Slider } from "../../ui/slider";
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

export const AudioSettings = memo(() => {
    const { t } = useTranslation();
    const { volume, soundEnabled, setVolume, setSoundEnabled } = useSettings();
    const volumePercent = Math.round(volume * 100);

    return (
        <div className="space-y-4">
            <div className={MENU_SECTION_SURFACE_CLASS} style={MENU_SECTION_SURFACE_STYLE}>
                <div className={MENU_SETTINGS_ROW_CLASS}>
                    <div className={MENU_SETTINGS_COPY_CLASS}>
                        <h4 className={MENU_SECTION_TITLE_CLASS} style={MENU_SECTION_TITLE_STYLE}>{t("settings.audio.soundTitle")}</h4>
                        <p className={MENU_SECTION_BODY_CLASS} style={MENU_SECTION_BODY_STYLE}>
                            {t("settings.audio.soundDescription")}
                        </p>
                    </div>
                    <Button
                        variant={soundEnabled ? "default" : "outline"}
                        aria-pressed={soundEnabled}
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        className={MENU_SETTINGS_CONTROL_CLASS}
                    >
                        {soundEnabled ? t("common.on") : t("common.off")}
                    </Button>
                </div>
            </div>
            <div className={MENU_SECTION_SURFACE_CLASS} style={MENU_SECTION_SURFACE_STYLE}>
                <div className="space-y-3">
                    <div className={MENU_SETTINGS_ROW_CLASS}>
                        <div className={MENU_SETTINGS_COPY_CLASS}>
                            <h4 className={MENU_SECTION_TITLE_CLASS} style={MENU_SECTION_TITLE_STYLE}>{t("settings.audio.masterVolume")}</h4>
                            <p className={MENU_SECTION_BODY_CLASS} style={MENU_SECTION_BODY_STYLE}>
                                {t("settings.audio.soundDescription")}
                            </p>
                        </div>
                        <span className={MENU_SECTION_BODY_CLASS} style={MENU_SECTION_BODY_STYLE}>{volumePercent}%</span>
                    </div>
                    <p className={MENU_SECTION_BODY_CLASS} style={MENU_SECTION_BODY_STYLE}>
                        {t("settings.audio.soundDescription")}
                    </p>
                    <Slider
                        value={[volumePercent]}
                        min={0}
                        max={100}
                        step={1}
                        onValueChange={(values) => setVolume(values[0] / 100)}
                        aria-label={t("settings.audio.masterVolume")}
                    />
                </div>
            </div>
        </div>
    );
});

AudioSettings.displayName = "AudioSettings";
