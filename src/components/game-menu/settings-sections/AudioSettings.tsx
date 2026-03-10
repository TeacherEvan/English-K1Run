import { memo } from "react";
import { useTranslation } from "react-i18next";
import { useSettings } from "../../../context/settings-context";
import { Button } from "../../ui/button";
import { Slider } from "../../ui/slider";

export const AudioSettings = memo(() => {
    const { t } = useTranslation();
    const { volume, soundEnabled, setVolume, setSoundEnabled } = useSettings();
    const volumePercent = Math.round(volume * 100);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h4 className="font-medium leading-none">{t("settings.audio.soundTitle")}</h4>
                    <p className="text-sm text-muted-foreground">
                        {t("settings.audio.soundDescription")}
                    </p>
                </div>
                <Button
                    variant={soundEnabled ? "default" : "outline"}
                    aria-pressed={soundEnabled}
                    onClick={() => setSoundEnabled(!soundEnabled)}
                >
                    {soundEnabled ? t("common.on") : t("common.off")}
                </Button>
            </div>
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <h4 className="font-medium leading-none">{t("settings.audio.masterVolume")}</h4>
                    <span className="text-sm text-muted-foreground">{volumePercent}%</span>
                </div>
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
    );
});

AudioSettings.displayName = "AudioSettings";
