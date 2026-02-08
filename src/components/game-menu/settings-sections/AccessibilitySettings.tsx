import { memo, useEffect, useState } from "react";
import { useSettings } from "../../../context/settings-context";
import {
    isAudioDescriptionsEnabled,
    setAudioDescriptionsEnabled,
} from "../../../lib/audio/audio-accessibility";
import { Button } from "../../ui/button";

export const AccessibilitySettings = memo(() => {
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
                    <h4 className="font-medium leading-none">High Contrast</h4>
                    <p className="text-sm text-muted-foreground">
                        Improve visibility with higher contrast colors
                    </p>
                </div>
                <Button
                    variant={highContrast ? "default" : "outline"}
                    aria-pressed={highContrast}
                    onClick={() => setHighContrast(!highContrast)}
                >
                    {highContrast ? "On" : "Off"}
                </Button>
            </div>
            <div className="flex items-center justify-between">
                <div>
                    <h4 className="font-medium leading-none">Reduced Motion</h4>
                    <p className="text-sm text-muted-foreground">
                        Minimize animations and movement
                    </p>
                </div>
                <Button
                    variant={reducedMotion ? "default" : "outline"}
                    aria-pressed={reducedMotion}
                    onClick={() => setReducedMotion(!reducedMotion)}
                >
                    {reducedMotion ? "On" : "Off"}
                </Button>
            </div>
            <div className="flex items-center justify-between">
                <div>
                    <h4 className="font-medium leading-none">Audio Descriptions</h4>
                    <p className="text-sm text-muted-foreground">
                        Speak short descriptions when audio is missing
                    </p>
                </div>
                <Button
                    variant={audioDescriptions ? "default" : "outline"}
                    aria-pressed={audioDescriptions}
                    onClick={toggleAudioDescriptions}
                >
                    {audioDescriptions ? "On" : "Off"}
                </Button>
            </div>
        </div>
    );
});

AccessibilitySettings.displayName = "AccessibilitySettings";
