import { memo, useCallback, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import type { ResolutionScale } from "../../context/settings-context";
import { useHomeMenuAudio } from "../../hooks/use-home-menu-audio";
import { UI_LAYER_MATRIX } from "../../lib/constants/ui-layer-matrix";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { GameMenuCreditsDialog } from "./GameMenuCreditsDialog";
import { GameMenuExitDialog } from "./GameMenuExitDialog";
import { GameMenuSettingsDialog } from "./GameMenuSettingsDialog";
import { GridIcon, PlayIcon, TrophyIcon } from "./icons";
import { MenuActionButtonContent } from "./MenuActionButtonContent";

interface GameMenuHomeProps {
    formattedBestTime: string;
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
        formattedBestTime,
        continuousMode,
        resolutionScale,
        setResolutionScale,
        onStartGame,
        onShowLevels,
        onToggleContinuousMode,
        onResetGame,
    }: GameMenuHomeProps) => {
        const { t } = useTranslation();
        useHomeMenuAudio();

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
                className="fixed inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-300 pointer-events-auto"
                style={{ zIndex: UI_LAYER_MATRIX.MENU_OVERLAY }}
                data-testid="game-menu"
            >
                <Card className="w-full max-w-4xl mx-4 p-8 bg-card/50 border-4 border-primary/20 shadow-2xl backdrop-blur-md">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                        {/* Left Column: Title & Mascot */}
                        <div className="flex flex-col items-center text-center space-y-6">
                            <div className="text-8xl animate-bounce cursor-default select-none filter drop-shadow-lg">
                                🐢
                            </div>
                            <div className="space-y-2">
                                <h1
                                    className="text-4xl md:text-5xl font-bold text-primary tracking-tight drop-shadow-sm"
                                    data-testid="game-title"
                                >
                                    {t("game.title")}
                                </h1>
                                <p className="text-base md:text-lg font-medium text-primary/80 max-w-sm">
                                    {t("menu.instructions")}
                                </p>
                            </div>

                            <div className="mt-8 p-6 bg-black/80 rounded-2xl border-2 border-yellow-500/50 shadow-[0_0_30px_rgba(234,179,8,0.2)] w-full max-w-xs transform hover:scale-105 transition-transform duration-300 group">
                                <div className="flex flex-col items-center">
                                    <div className="flex items-center gap-2 mb-2">
                                        <TrophyIcon className="w-5 h-5 text-yellow-500 group-hover:rotate-12 transition-transform" />
                                        <span className="text-yellow-500 font-bold uppercase tracking-widest text-sm">
                                            {t("game.bestTime")}
                                        </span>
                                    </div>
                                    <div
                                        className="text-4xl font-mono font-bold text-yellow-400 group-hover:text-yellow-300 transition-colors"
                                        style={{ textShadow: "0 0 20px rgba(234,179,8,0.6)" }}
                                    >
                                        {formattedBestTime}
                                    </div>
                                    {continuousMode && (
                                        <div className="mt-2 text-xs text-white/60 bg-green-900/50 px-2 py-1 rounded-full border border-green-500/30">
                                            {t("game.continuousMode")}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 w-full max-w-sm mx-auto">
                            <Button
                                size="lg"
                                className="h-20 text-2xl font-bold shadow-lg hover:scale-105 hover:shadow-primary/25 transition-all duration-200 gap-4 border-b-4 border-primary-foreground/20 active:border-b-0 active:translate-y-1 bg-green-700 hover:bg-green-800 text-white"
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
                                        iconWrapperClassName="p-2 bg-white/20 rounded-full"
                                        title={t("game.startGame")}
                                    />
                                </span>
                            </Button>

                            <Button
                                variant="default"
                                size="lg"
                                className="h-16 text-xl font-bold shadow-md hover:scale-105 transition-all duration-200 gap-4 border-b-4 border-primary-foreground/20 active:border-b-0 active:translate-y-1 bg-blue-700 hover:bg-blue-800 text-white"
                                onClick={handlePlayAllLevels}
                                disabled={!canPlayAllLevels}
                                data-testid="play-all-levels-button"
                                aria-label={t("game.playAllLevels")}
                            >
                                <MenuActionButtonContent
                                    icon={<TrophyIcon className="w-6 h-6" />}
                                    iconWrapperClassName="p-2 bg-white/20 rounded-full"
                                    title={t("game.playAllLevels")}
                                />
                            </Button>

                            <Button
                                variant="default"
                                size="lg"
                                className="h-16 text-xl font-bold shadow-md hover:scale-105 transition-all duration-200 gap-4"
                                onClick={onShowLevels}
                                onKeyDown={(event) => handleMenuKeyDown(event, onShowLevels)}
                                data-testid="level-select-button"
                                aria-label={t("game.levelSelect")}
                            >
                                <MenuActionButtonContent
                                    icon={<GridIcon className="w-6 h-6" />}
                                    title={t("game.levelSelect")}
                                />
                            </Button>

                            <GameMenuSettingsDialog
                                resolutionScale={resolutionScale}
                                setResolutionScale={setResolutionScale}
                                continuousMode={continuousMode}
                                onToggleContinuousMode={onToggleContinuousMode}
                            />

                            <GameMenuExitDialog onResetGame={onResetGame} />

                            <GameMenuCreditsDialog />
                        </div>
                    </div>
                </Card>
            </div>
        );
    }
);

GameMenuHome.displayName = "GameMenuHome";
