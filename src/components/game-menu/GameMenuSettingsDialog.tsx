import { memo } from "react";
import { useTranslation } from "react-i18next";
import type { ResolutionScale } from "../../context/settings-context";
import { useSettings } from "../../context/settings-context";
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
import { getMenuActionLabel } from "./menu-action-labels";
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
        const { t } = useTranslation();
        const { gameplayLanguage } = useSettings();
        const settingsLabel = getMenuActionLabel("game.settings", gameplayLanguage);

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
                            title={settingsLabel.title}
                            subtitle={settingsLabel.subtitle}
                        />
                    </Button>
                </DialogTrigger>
                <DialogContent className="border-border/80 bg-background/98 shadow-2xl backdrop-blur-sm sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl flex items-center gap-2">
                            <SettingsIcon className="w-6 h-6" />
                            {t("settings.title")}
                        </DialogTitle>
                        <DialogDescription>
                            {t("settings.description")}
                        </DialogDescription>
                    </DialogHeader>
                    <Tabs defaultValue="controls" className="py-4">
                        <TabsList className="w-full justify-between bg-muted/90">
                            <TabsTrigger value="audio">{t("settings.tabs.audio")}</TabsTrigger>
                            <TabsTrigger value="visual">{t("settings.tabs.visual")}</TabsTrigger>
                            <TabsTrigger value="controls">{t("settings.tabs.controls")}</TabsTrigger>
                            <TabsTrigger value="accessibility">
                                {t("settings.tabs.accessibility")}
                            </TabsTrigger>
                        </TabsList>
                        <div className="mt-6 rounded-lg border border-border/80 bg-card/95 p-4 shadow-sm backdrop-blur-sm">
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
