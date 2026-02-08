import { memo } from "react";
import type { ResolutionScale, Theme } from "../../../context/settings-context";
import { useSettings } from "../../../context/settings-context";
import { Button } from "../../ui/button";
import { DISPLAY_SCALE_OPTIONS } from "../constants";

interface VisualSettingsProps {
    resolutionScale: ResolutionScale;
    setResolutionScale: (scale: ResolutionScale) => void;
}

const THEME_OPTIONS: Array<{ id: Theme; label: string }> = [
    { id: "colorful", label: "Colorful" },
    { id: "light", label: "Light" },
    { id: "dark", label: "Dark" },
];

export const VisualSettings = memo(
    ({ resolutionScale, setResolutionScale }: VisualSettingsProps) => {
        const { theme, setTheme } = useSettings();

        return (
            <div className="space-y-4">
                <div className="space-y-2">
                    <h4 className="font-medium leading-none">Theme</h4>
                    <p className="text-sm text-muted-foreground">
                        Choose a color theme for the interface
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                        {THEME_OPTIONS.map((option) => (
                            <Button
                                key={option.id}
                                variant={theme === option.id ? "default" : "outline"}
                                onClick={() => setTheme(option.id)}
                                aria-pressed={theme === option.id}
                            >
                                {option.label}
                            </Button>
                        ))}
                    </div>
                </div>
                <div className="space-y-2">
                    <h4 className="font-medium leading-none">Display Scale</h4>
                    <p className="text-sm text-muted-foreground">
                        Adjust UI size for your screen
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
                                {option.label}
                            </Button>
                        ))}
                    </div>
                </div>
            </div>
        );
    },
);

VisualSettings.displayName = "VisualSettings";
