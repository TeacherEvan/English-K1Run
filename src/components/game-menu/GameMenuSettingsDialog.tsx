import { memo, useCallback } from "react";
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
    languageDiscoveryActive: boolean;
    onLanguageDiscoverySeen: () => void;
    onToggleContinuousMode?: (enabled: boolean) => void;
}

export const GameMenuSettingsDialog = memo(
    ({
        resolutionScale,
        setResolutionScale,
        continuousMode,
        languageDiscoveryActive,
        onLanguageDiscoverySeen,
        onToggleContinuousMode,
    }: GameMenuSettingsDialogProps) => {
        const { t } = useTranslation();
        const { gameplayLanguage } = useSettings();
        const settingsLabel = getMenuActionLabel("game.settings", gameplayLanguage);
        const handleOpenChange = useCallback(
            (open: boolean) => {
                if (open && languageDiscoveryActive) {
                    onLanguageDiscoverySeen();
                }
            },
            [languageDiscoveryActive, onLanguageDiscoverySeen],
        );

        return (
            <Dialog onOpenChange={handleOpenChange}>
                <DialogTrigger asChild>
                    <Button
                        variant="outline"
                        size="lg"
                        className="menu-support-action menu-language-discovery-trigger h-19 justify-start gap-4 rounded-3xl border border-slate-200 bg-[#fbf6ea] px-6 text-lg font-semibold text-slate-900 shadow-[0_10px_18px_rgba(71,85,105,0.08)] hover:-translate-y-0.5 hover:bg-[#f4ecd8] hover:shadow-[0_16px_24px_rgba(71,85,105,0.12)]"
                        data-testid="settings-button"
                        data-language-discovery={languageDiscoveryActive ? "active" : "idle"}
                        role="button"
                    >
                        <MenuActionButtonContent
                            icon={<SettingsIcon className="h-6 w-6 text-slate-700" />}
                            subtitleClassName="mt-1 text-sm font-medium text-slate-600"
                            textClassName="menu-action-copy flex flex-col items-start leading-tight"
                            title={settingsLabel.title}
                            subtitle={settingsLabel.subtitle}
                        />
                    </Button>
                </DialogTrigger>
                <DialogContent className="menu-settings-dialog border-border/80 bg-background/98 shadow-2xl backdrop-blur-sm sm:max-w-2xl">
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
                        <TabsList className="menu-settings-tabs-list w-full justify-stretch bg-muted/90">
                            <TabsTrigger className="menu-settings-tab" value="audio">{t("settings.tabs.audio")}</TabsTrigger>
                            <TabsTrigger className="menu-settings-tab" value="visual">{t("settings.tabs.visual")}</TabsTrigger>
                            <TabsTrigger className="menu-settings-tab" value="controls">{t("settings.tabs.controls")}</TabsTrigger>
                            <TabsTrigger className="menu-settings-tab" value="accessibility">
                                {t("settings.tabs.accessibility")}
                            </TabsTrigger>
                        </TabsList>
                        <div
                            data-testid="settings-surface-panel"
                            className="menu-settings-surface mt-6 rounded-3xl border border-amber-200/70 bg-[rgba(255,250,240,0.94)] p-4 shadow-[0_18px_32px_rgba(71,85,105,0.1)] backdrop-blur-sm"
                        >
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
