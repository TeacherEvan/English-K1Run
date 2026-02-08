import { memo } from "react";
import { useSettings } from "../../../context/settings-context";
import { Button } from "../../ui/button";
import { Slider } from "../../ui/slider";

export const AudioSettings = memo(() => {
    const { volume, soundEnabled, setVolume, setSoundEnabled } = useSettings();
    const volumePercent = Math.round(volume * 100);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h4 className="font-medium leading-none">Sound</h4>
                    <p className="text-sm text-muted-foreground">
                        Enable or mute all game audio
                    </p>
                </div>
                <Button
                    variant={soundEnabled ? "default" : "outline"}
                    aria-pressed={soundEnabled}
                    onClick={() => setSoundEnabled(!soundEnabled)}
                >
                    {soundEnabled ? "On" : "Off"}
                </Button>
            </div>
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <h4 className="font-medium leading-none">Master Volume</h4>
                    <span className="text-sm text-muted-foreground">{volumePercent}%</span>
                </div>
                <Slider
                    value={[volumePercent]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={(values) => setVolume(values[0] / 100)}
                    aria-label="Master volume"
                />
            </div>
        </div>
    );
});

AudioSettings.displayName = "AudioSettings";
