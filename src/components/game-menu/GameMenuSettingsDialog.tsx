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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { SettingsIcon } from "./icons";
import { MenuActionButtonContent } from "./MenuActionButtonContent";
import { AccessibilitySettings } from "./settings-sections/AccessibilitySettings";
import { AudioSettings } from "./settings-sections/AudioSettings";
import { ControlSettings } from "./settings-sections/ControlSettings";
import { VisualSettings } from "./settings-sections/VisualSettings";

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
                            subtitleClassName="text-xs font-semibold text-foreground font-thai mt-1"
                        />
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl flex items-center gap-2">
                            <SettingsIcon className="w-6 h-6" />
                            Settings / การตั้งค่า
                        </DialogTitle>
                        <DialogDescription>
                            Configure audio, visuals, controls, and accessibility
                        </DialogDescription>
                    </DialogHeader>
                    <Tabs defaultValue="audio" className="py-4">
                        <TabsList className="w-full justify-between">
                            <TabsTrigger value="audio">Audio</TabsTrigger>
                            <TabsTrigger value="visual">Visual</TabsTrigger>
                            <TabsTrigger value="controls">Controls</TabsTrigger>
                            <TabsTrigger value="accessibility">Accessibility</TabsTrigger>
                        </TabsList>
                        <div className="mt-6 rounded-lg border bg-card/50 p-4">
                            <TabsContent value="audio">
                                <AudioSettings />
                            </TabsContent>
                            <TabsContent value="visual">
                                <VisualSettings
                                    resolutionScale={resolutionScale}
                                    setResolutionScale={setResolutionScale}
                                />
                            </TabsContent>
                            <TabsContent value="controls">
                                <ControlSettings
                                    continuousMode={continuousMode}
                                    onToggleContinuousMode={onToggleContinuousMode}
                                />
                            </TabsContent>
                            <TabsContent value="accessibility">
                                <AccessibilitySettings />
                            </TabsContent>
                        </div>
                    </Tabs>
                </DialogContent>
            </Dialog>
        );
    }
);

GameMenuSettingsDialog.displayName = "GameMenuSettingsDialog";
