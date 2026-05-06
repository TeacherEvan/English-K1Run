import { lazy, memo, Suspense, useCallback } from "react";
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
import { SettingsIcon } from "./icons";
import { getMenuActionLabel } from "./menu-action-labels";
import { MenuActionButtonContent } from "./MenuActionButtonContent";
import {
    MENU_ACTION_TEXT_CLASS,
    MENU_DIALOG_CLASS,
    MENU_DIALOG_DESCRIPTION_CLASS,
    MENU_DIALOG_DESCRIPTION_STYLE,
    MENU_DIALOG_HEADER_TITLE_CLASS,
    MENU_DIALOG_STYLE,
    MENU_DIALOG_TITLE_STYLE,
    MENU_UTILITY_ACTION_ACTIVE_STYLE,
    MENU_UTILITY_ACTION_CLASS,
    MENU_UTILITY_ACTION_STYLE,
    MENU_UTILITY_SUBTITLE_STYLE,
} from "./menu-surface-theme";

const GameMenuSettingsDialogPanel = lazy(() =>
    import("./GameMenuSettingsDialogPanel").then((m) => ({
        default: m.GameMenuSettingsDialogPanel,
    })),
);

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
                        className={`menu-language-discovery-trigger ${MENU_UTILITY_ACTION_CLASS}`}
                        style={languageDiscoveryActive ? MENU_UTILITY_ACTION_ACTIVE_STYLE : MENU_UTILITY_ACTION_STYLE}
                        data-testid="settings-button"
                        data-language-discovery={languageDiscoveryActive ? "active" : "idle"}
                        role="button"
                    >
                        <MenuActionButtonContent
                            icon={<SettingsIcon className="h-6 w-6 text-[rgb(164,92,53)]" />}
                            subtitleClassName="mt-1 text-sm font-medium"
                            subtitleStyle={MENU_UTILITY_SUBTITLE_STYLE}
                            textClassName={MENU_ACTION_TEXT_CLASS}
                            title={settingsLabel.title}
                            subtitle={settingsLabel.subtitle}
                        />
                    </Button>
                </DialogTrigger>
                <DialogContent className={`menu-settings-dialog ${MENU_DIALOG_CLASS} flex max-h-[min(90vh,42rem)] flex-col overflow-y-auto overflow-x-hidden sm:max-w-xl`} style={MENU_DIALOG_STYLE}>
                    <DialogHeader>
                        <DialogTitle className={MENU_DIALOG_HEADER_TITLE_CLASS} style={MENU_DIALOG_TITLE_STYLE}>
                            <SettingsIcon className="w-6 h-6" />
                            {t("settings.title")}
                        </DialogTitle>
                        <DialogDescription className={MENU_DIALOG_DESCRIPTION_CLASS} style={MENU_DIALOG_DESCRIPTION_STYLE}>
                            {t("settings.description")}
                        </DialogDescription>
                    </DialogHeader>
                    <Suspense
                        fallback={
                            <div
                                data-testid="settings-dialog-loading"
                                className="flex min-h-56 items-center justify-center py-4 text-sm font-medium text-slate-700"
                            >
                                {t("common.loading", { defaultValue: "Loading settings..." })}
                            </div>
                        }
                    >
                        <GameMenuSettingsDialogPanel
                            t={t}
                            resolutionScale={resolutionScale}
                            setResolutionScale={setResolutionScale}
                            continuousMode={continuousMode}
                            onToggleContinuousMode={onToggleContinuousMode}
                        />
                    </Suspense>
                </DialogContent>
            </Dialog>
        );
    }
);

GameMenuSettingsDialog.displayName = "GameMenuSettingsDialog";
