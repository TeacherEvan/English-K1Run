import { memo } from "react";
import { Button } from "../../ui/button";
import { LanguageSelector } from "../../ui/language-selector";

interface ControlSettingsProps {
    continuousMode: boolean;
    onToggleContinuousMode?: (enabled: boolean) => void;
}

export const ControlSettings = memo(
    ({ continuousMode, onToggleContinuousMode }: ControlSettingsProps) => {
        return (
            <div className="space-y-4">
                <div>
                    <h4 className="font-medium leading-none mb-2">Language</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                        Select gameplay language and voiceovers
                    </p>
                    <LanguageSelector showLabel={false} className="w-full" />
                </div>
                <div className="flex items-center justify-between rounded-lg border bg-card/50 p-4">
                    <div className="space-y-1">
                        <h4 className="font-medium leading-none">Continuous Mode</h4>
                        <p className="text-sm text-muted-foreground">
                            Play without winning or stopping
                        </p>
                    </div>
                    <Button
                        variant={continuousMode ? "default" : "outline"}
                        onClick={() => onToggleContinuousMode?.(!continuousMode)}
                        className={continuousMode ? "bg-green-600 hover:bg-green-700" : ""}
                        aria-pressed={continuousMode}
                    >
                        {continuousMode ? "On" : "Off"}
                    </Button>
                </div>
            </div>
        );
    },
);

ControlSettings.displayName = "ControlSettings";
