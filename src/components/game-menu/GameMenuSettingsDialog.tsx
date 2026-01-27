import { memo } from "react";
import type { ResolutionScale } from "../../context/settings-context";
import { Button } from "../ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "../ui/dialog";
import { LanguageSelector } from "../ui/language-selector";
import { DISPLAY_SCALE_OPTIONS } from "./constants";
import { CheckIcon, SettingsIcon } from "./icons";
import { MenuActionButtonContent } from "./MenuActionButtonContent";

interface GameMenuSettingsDialogProps {
    resolutionScale: ResolutionScale;
    setResolutionScale: (scale: ResolutionScale) => void;
    continuousMode: boolean;
    onToggleContinuousMode?: (enabled: boolean) => void;
}

export const GameMenuSettingsDialog = memo(
    ({
        resolutionScale,
        setResolutionScale,
        continuousMode,
        onToggleContinuousMode,
    }: GameMenuSettingsDialogProps) => {
        return (
            <Dialog>
                <DialogTrigger asChild>
                    <Button
                        variant="outline"
                        size="lg"
                        className="h-16 text-xl font-semibold justify-start px-8 gap-4 hover:bg-primary/5 border-2"
                        data-testid="settings-button"
                        role="button"
                    >
                        <MenuActionButtonContent
                            icon={<SettingsIcon className="w-6 h-6 text-primary" />}
                            title="Settings"
                            subtitle="การตั้งค่า"
                            subtitleClassName="text-xs font-normal opacity-70 font-thai mt-1"
                        />
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-2xl flex items-center gap-2">
                            <SettingsIcon className="w-6 h-6" />
                            Settings / การตั้งค่า
                        </DialogTitle>
                        <DialogDescription>Configure your game experience</DialogDescription>
                    </DialogHeader>
                    <div className="py-6 space-y-6">
                        <div className="flex flex-col gap-4 p-4 rounded-lg border bg-card/50">
                            <div>
                                <h4 className="font-medium leading-none mb-3">Language</h4>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Select gameplay language and voiceovers
                                </p>
                                <LanguageSelector showLabel={false} className="w-full" />
                            </div>
                        </div>
                        <div className="flex flex-col gap-3 p-4 rounded-lg border bg-card/50">
                            <div>
                                <h4 className="font-medium leading-none mb-2">Display Scale</h4>
                                <p className="text-sm text-muted-foreground">
                                    Adjust UI size for your screen
                                </p>
                            </div>
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
                        <div className="flex items-center justify-between p-4 rounded-lg border bg-card/50">
                            <div className="space-y-1">
                                <h4 className="font-medium leading-none">Continuous Mode</h4>
                                <p className="text-sm text-muted-foreground">
                                    Play without winning/stopping
                                </p>
                            </div>
                            <Button
                                variant={continuousMode ? "default" : "outline"}
                                onClick={() => onToggleContinuousMode?.(!continuousMode)}
                                className={
                                    continuousMode ? "bg-green-600 hover:bg-green-700" : ""
                                }
                                aria-pressed={continuousMode}
                            >
                                {continuousMode ? <CheckIcon className="w-4 h-4 mr-2" /> : null}
                                {continuousMode ? "On" : "Off"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }
);

GameMenuSettingsDialog.displayName = "GameMenuSettingsDialog";
