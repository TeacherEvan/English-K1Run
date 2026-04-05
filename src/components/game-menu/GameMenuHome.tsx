import { memo, useCallback, type KeyboardEvent } from "react";
import type { ChallengeModeHighScoreEntry } from "@/lib/challenge-mode-high-scores";
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
} from "./menu-surface-theme";
import { MenuActionButtonContent } from "./MenuActionButtonContent";

interface GameMenuHomeProps {
    formattedBestTargetTotal: string;
    highScores: ChallengeModeHighScoreEntry[];
    continuousMode: boolean;
    resolutionScale: ResolutionScale;
    setResolutionScale: (scale: ResolutionScale) => void;
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
        resolutionScale,
        setResolutionScale,
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
                    <div className="menu-home-layout grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(18rem,24rem)] lg:items-center">
                        <GameMenuHero
                            formattedBestTargetTotal={formattedBestTargetTotal}
                            continuousMode={continuousMode}
                        />

                        <GameMenuActionStack className="menu-home-actions">
                            <Button
                                size="lg"
                                className="menu-action-card menu-action-card--start menu-primary-action h-21 gap-4 rounded-3xl border border-emerald-900/10 bg-emerald-600 px-5 text-[1.35rem] font-bold text-white shadow-[0_18px_28px_rgba(22,163,74,0.24)] hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-[0_22px_34px_rgba(22,163,74,0.26)] focus-visible:ring-emerald-200/70 sm:px-6"
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
                                        subtitleClassName="mt-1 text-sm font-medium text-white/78"
                                        textClassName="menu-action-copy flex flex-col items-start leading-tight"
                                        title={startGameLabel.title}
                                        subtitle={startGameLabel.subtitle}
                                    />
                                </span>
                            </Button>

                            <Button
                                variant="default"
                                size="lg"
                                className="menu-action-card menu-action-card--challenge menu-secondary-action h-19 gap-4 rounded-3xl border border-blue-950/10 bg-blue-600 text-xl font-bold text-white shadow-[0_16px_24px_rgba(37,99,235,0.2)] hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-[0_20px_30px_rgba(37,99,235,0.24)]"
                                onClick={handlePlayAllLevels}
                                disabled={!canPlayAllLevels}
                                data-testid="play-all-levels-button"
                                aria-label={t("game.playAllLevels")}
                            >
                                <MenuActionButtonContent
                                    icon={<TrophyIcon className="w-6 h-6" />}
                                    iconWrapperClassName="menu-action-icon-shell menu-action-icon-shell--challenge"
                                    subtitleClassName="mt-1 text-sm font-medium text-white/78"
                                    textClassName="menu-action-copy flex flex-col items-start leading-tight"
                                    title={playAllLevelsLabel.title}
                                    subtitle={playAllLevelsLabel.subtitle}
                                />
                            </Button>

                            <Button
                                variant="default"
                                size="lg"
                                className="menu-action-card menu-action-card--map menu-tertiary-action h-19 gap-4 rounded-3xl border border-slate-200 bg-[#fbf6ea] text-xl font-bold text-slate-900 shadow-[0_10px_18px_rgba(71,85,105,0.12)] hover:-translate-y-0.5 hover:bg-[#f4ecd8] hover:shadow-[0_16px_24px_rgba(71,85,105,0.16)]"
                                onClick={onShowLevels}
                                onKeyDown={(event) => handleMenuKeyDown(event, onShowLevels)}
                                data-testid="level-select-button"
                                aria-label={t("game.levelSelect")}
                            >
                                <MenuActionButtonContent
                                    icon={<GridIcon className="w-6 h-6" />}
                                    iconWrapperClassName="menu-action-icon-shell menu-action-icon-shell--map"
                                    subtitleClassName="mt-1 text-sm font-medium text-slate-600"
                                    textClassName="menu-action-copy flex flex-col items-start leading-tight"
                                    title={levelSelectLabel.title}
                                    subtitle={levelSelectLabel.subtitle}
                                />
                            </Button>

                            <GameMenuHighScoresDialog highScores={highScores} />

                            <GameMenuSettingsDialog
                                resolutionScale={resolutionScale}
                                setResolutionScale={setResolutionScale}
                                continuousMode={continuousMode}
                                onToggleContinuousMode={onToggleContinuousMode}
                            />

                            <GameMenuExitDialog onResetGame={onResetGame} />

                            <GameMenuCreditsDialog />
                        </GameMenuActionStack>
                    </div>
                </Card>
            </div>
        );
    }
);

GameMenuHome.displayName = "GameMenuHome";
