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
                        className="menu-support-action menu-language-discovery-trigger h-[4.4rem] w-full min-w-0 justify-start gap-4 rounded-[1.4rem] border border-[rgba(212,156,84,0.32)] bg-[linear-gradient(145deg,rgba(255,247,232,0.98),rgba(244,252,242,0.95)_58%,rgba(255,236,221,0.94))] px-5 text-base font-semibold text-[rgb(63,52,41)] shadow-[0_12px_24px_rgba(120,53,15,0.1)] hover:-translate-y-0.5 hover:bg-[linear-gradient(145deg,rgba(255,242,221,1),rgba(236,249,239,0.96)_58%,rgba(255,230,213,0.96))] hover:shadow-[0_18px_30px_rgba(120,53,15,0.14)]"
                        data-testid="settings-button"
                        data-language-discovery={languageDiscoveryActive ? "active" : "idle"}
                        role="button"
                    >
                        <MenuActionButtonContent
                            icon={<SettingsIcon className="h-6 w-6 text-[rgb(164,92,53)]" />}
                            subtitleClassName="mt-1 text-sm font-medium text-[rgba(100,84,68,0.86)]"
                            textClassName="menu-action-copy flex min-w-0 flex-1 flex-col items-start leading-tight"
                            title={settingsLabel.title}
                            subtitle={settingsLabel.subtitle}
                        />
                    </Button>
                </DialogTrigger>
                <DialogContent className="menu-settings-dialog border-[rgba(214,144,62,0.2)] bg-[linear-gradient(180deg,rgba(255,252,246,0.99),rgba(249,255,250,0.97)_52%,rgba(255,245,236,0.98))] shadow-2xl backdrop-blur-sm sm:max-w-2xl">
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
                        <TabsList className="menu-settings-tabs-list w-full justify-stretch bg-[rgba(246,236,213,0.72)]">
                            <TabsTrigger className="menu-settings-tab" value="audio">{t("settings.tabs.audio")}</TabsTrigger>
                            <TabsTrigger className="menu-settings-tab" value="visual">{t("settings.tabs.visual")}</TabsTrigger>
                            <TabsTrigger className="menu-settings-tab" value="controls">{t("settings.tabs.controls")}</TabsTrigger>
                            <TabsTrigger className="menu-settings-tab" value="accessibility">
                                {t("settings.tabs.accessibility")}
                            </TabsTrigger>
                        </TabsList>
                        <div
                            data-testid="settings-surface-panel"
                            className="menu-settings-surface mt-6 rounded-3xl border border-[rgba(212,156,84,0.28)] bg-[linear-gradient(155deg,rgba(255,250,241,0.96),rgba(241,252,245,0.94)_50%,rgba(255,238,227,0.94))] p-4 shadow-[0_18px_32px_rgba(120,53,15,0.1)] backdrop-blur-sm"
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
