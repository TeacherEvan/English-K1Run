import { memo, useCallback, type KeyboardEvent } from "react";
import type { ChallengeModeHighScoreEntry } from "@/lib/challenge-mode-high-scores";
import type { GameMenuCompactLayout } from "@/components/game-menu/menu-layout-mode";
import { useTranslation } from "react-i18next";
import type { ResolutionScale } from "../../context/settings-context";
import { useSettings } from "../../context/settings-context";
import { useHomeMenuAudio } from "../../hooks/use-home-menu-audio";
import { UI_LAYER_MATRIX } from "../../lib/constants/ui-layer-matrix";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { GameMenuActionStack } from "./GameMenuActionStack";
import { GameMenuCreditsDialog } from "./GameMenuCreditsDialog";
import { GameMenuExitDialog } from "./GameMenuExitDialog";
import { GameMenuHero } from "./GameMenuHero";
import { GameMenuHighScoresDialog } from "./GameMenuHighScoresDialog";
import { GameMenuSettingsDialog } from "./GameMenuSettingsDialog";
import { GridIcon, PlayIcon, TrophyIcon } from "./icons";
import { getMenuActionLabel } from "./menu-action-labels";
import {
    MENU_OVERLAY_CLASS,
    MENU_OVERLAY_STYLE,
    MENU_PANEL_CLASS,
    MENU_PANEL_STYLE,
    MENU_PRIMARY_ACTION_CLASS,
    MENU_PRIMARY_ACTION_STYLE,
    MENU_SECONDARY_ACTION_CLASS,
    MENU_SECONDARY_ACTION_STYLE,
    MENU_TERTIARY_ACTION_CLASS,
    MENU_TERTIARY_ACTION_STYLE,
    MENU_ACTION_TEXT_CLASS,
    MENU_ACTION_SUBTITLE_LIGHT_CLASS,
    MENU_ACTION_SUBTITLE_MUTED_CLASS,
    MENU_UTILITY_EYEBROW_CLASS,
    MENU_UTILITY_EYEBROW_STYLE,
    MENU_UTILITY_GROUP_CLASS,
    MENU_UTILITY_GROUP_STYLE,
} from "./menu-surface-theme";
import { MenuActionButtonContent } from "./MenuActionButtonContent";

interface GameMenuHomeProps {
    formattedBestTargetTotal: string;
    highScores: ChallengeModeHighScoreEntry[];
    continuousMode: boolean;
    languageDiscoveryActive: boolean;
    resolutionScale: ResolutionScale;
    compactLayout: GameMenuCompactLayout;
    setResolutionScale: (scale: ResolutionScale) => void;
    onLanguageDiscoverySeen: () => void;
    onStartGame: () => void;
    onShowLevels: () => void;
    onToggleContinuousMode?: (enabled: boolean) => void;
    onResetGame?: () => void;
}

export const GameMenuHome = memo(
    ({
        formattedBestTargetTotal,
        highScores,
        continuousMode,
        languageDiscoveryActive,
        resolutionScale,
        compactLayout,
        setResolutionScale,
        onLanguageDiscoverySeen,
        onStartGame,
        onShowLevels,
        onToggleContinuousMode,
        onResetGame,
    }: GameMenuHomeProps) => {
        const { t } = useTranslation();
        const { gameplayLanguage } = useSettings();
        useHomeMenuAudio();
        const startGameLabel = getMenuActionLabel("game.startGame", gameplayLanguage);
        const playAllLevelsLabel = getMenuActionLabel(
            "game.playAllLevels",
            gameplayLanguage,
        );
        const levelSelectLabel = getMenuActionLabel("game.levelSelect", gameplayLanguage);

        const canPlayAllLevels = Boolean(onToggleContinuousMode);
        const handlePlayAllLevels = useCallback(() => {
            if (!onToggleContinuousMode) return;
            onToggleContinuousMode(true);
            onStartGame();
        }, [onStartGame, onToggleContinuousMode]);

        const handleMenuKeyDown = useCallback(
            (event: KeyboardEvent<HTMLButtonElement>, action: () => void) => {
                if (event.key !== "Enter" && event.key !== " ") return;
                event.preventDefault();
                action();
            },
            [],
        );

        return (
            <div
                className={MENU_OVERLAY_CLASS}
                style={{
                    ...MENU_OVERLAY_STYLE,
                    zIndex: UI_LAYER_MATRIX.MENU_OVERLAY,
                }}
                data-testid="game-menu"
            >
                <Card
                    className={`${MENU_PANEL_CLASS} menu-home-panel menu-home-shell`}
                    style={MENU_PANEL_STYLE}
                >
                    <div
                        className="menu-home-layout grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(18rem,24rem)] lg:items-center"
                        data-compact-layout={compactLayout}
                    >
                        <GameMenuHero
                            formattedBestTargetTotal={formattedBestTargetTotal}
                            continuousMode={continuousMode}
                        />

                        <GameMenuActionStack
                            className="menu-home-actions"
                            data-compact-layout={compactLayout}
                        >
                            <div className="space-y-3">
                                <Button
                                    size="lg"
                                    className={MENU_PRIMARY_ACTION_CLASS}
                                    style={MENU_PRIMARY_ACTION_STYLE}
                                    onClick={onStartGame}
                                    data-testid="start-game-button"
                                    aria-label={t("game.startGame")}
                                >
                                    <span
                                        className="flex items-center gap-4 w-full"
                                        data-testid="new-game-button"
                                    >
                                        <MenuActionButtonContent
                                            icon={<PlayIcon className="w-6 h-6 fill-current" />}
                                            iconWrapperClassName="menu-action-icon-shell menu-action-icon-shell--start"
                                            subtitleClassName={MENU_ACTION_SUBTITLE_LIGHT_CLASS}
                                            textClassName={MENU_ACTION_TEXT_CLASS}
                                            title={startGameLabel.title}
                                            subtitle={startGameLabel.subtitle}
                                        />
                                    </span>
                                </Button>

                                <Button
                                    variant="default"
                                    size="lg"
                                    className={MENU_SECONDARY_ACTION_CLASS}
                                    style={MENU_SECONDARY_ACTION_STYLE}
                                    onClick={handlePlayAllLevels}
                                    disabled={!canPlayAllLevels}
                                    data-testid="play-all-levels-button"
                                    aria-label={t("game.playAllLevels")}
                                >
                                    <MenuActionButtonContent
                                        icon={<TrophyIcon className="w-6 h-6" />}
                                        iconWrapperClassName="menu-action-icon-shell menu-action-icon-shell--challenge"
                                            subtitleClassName={MENU_ACTION_SUBTITLE_LIGHT_CLASS}
                                            textClassName={MENU_ACTION_TEXT_CLASS}
                                        title={playAllLevelsLabel.title}
                                        subtitle={playAllLevelsLabel.subtitle}
                                    />
                                </Button>

                                <Button
                                    variant="default"
                                    size="lg"
                                    className={MENU_TERTIARY_ACTION_CLASS}
                                    style={MENU_TERTIARY_ACTION_STYLE}
                                    onClick={onShowLevels}
                                    onKeyDown={(event) => handleMenuKeyDown(event, onShowLevels)}
                                    data-testid="level-select-button"
                                    aria-label={t("game.levelSelect")}
                                >
                                    <MenuActionButtonContent
                                        icon={<GridIcon className="w-6 h-6" />}
                                        iconWrapperClassName="menu-action-icon-shell menu-action-icon-shell--map"
                                            subtitleClassName={MENU_ACTION_SUBTITLE_MUTED_CLASS}
                                            textClassName={MENU_ACTION_TEXT_CLASS}
                                        title={levelSelectLabel.title}
                                        subtitle={levelSelectLabel.subtitle}
                                    />
                                </Button>
                            </div>

                            <div className={MENU_UTILITY_GROUP_CLASS} style={MENU_UTILITY_GROUP_STYLE}>
                                <p className={MENU_UTILITY_EYEBROW_CLASS} style={MENU_UTILITY_EYEBROW_STYLE}>
                                    {t("menu.moreOptions", { defaultValue: "More options" })}
                                </p>
                                <div className="grid gap-3">
                                    <GameMenuSettingsDialog
                                        resolutionScale={resolutionScale}
                                        setResolutionScale={setResolutionScale}
                                        continuousMode={continuousMode}
                                        languageDiscoveryActive={languageDiscoveryActive}
                                        onLanguageDiscoverySeen={onLanguageDiscoverySeen}
                                        onToggleContinuousMode={onToggleContinuousMode}
                                    />

                                    <GameMenuHighScoresDialog highScores={highScores} />

                                    <GameMenuExitDialog onResetGame={onResetGame} />
                                </div>
                                <div className="mt-2 px-2">
                                    <GameMenuCreditsDialog />
                                </div>
                            </div>
                        </GameMenuActionStack>
                    </div>
                </Card>
            </div>
        );
    }
);

GameMenuHome.displayName = "GameMenuHome";
