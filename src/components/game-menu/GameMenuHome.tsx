import { memo, useCallback, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import type { ResolutionScale } from "../../context/settings-context";
import { useSettings } from "../../context/settings-context";
import { useHomeMenuAudio } from "../../hooks/use-home-menu-audio";
import { UI_LAYER_MATRIX } from "../../lib/constants/ui-layer-matrix";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { GameMenuCreditsDialog } from "./GameMenuCreditsDialog";
import { GameMenuExitDialog } from "./GameMenuExitDialog";
import { GameMenuSettingsDialog } from "./GameMenuSettingsDialog";
import { GridIcon, PlayIcon, TrophyIcon } from "./icons";
import { getMenuActionLabel } from "./menu-action-labels";
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
                className="fixed inset-0 flex items-start justify-center overflow-x-hidden overflow-y-auto bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.16),_rgba(255,250,240,0.96)_32%,_rgba(239,246,255,0.96)_100%)] px-4 py-6 pointer-events-auto sm:px-6 sm:py-8 lg:items-center"
                style={{ zIndex: UI_LAYER_MATRIX.MENU_OVERLAY }}
                data-testid="game-menu"
            >
                <Card className="mx-auto w-full max-w-5xl overflow-hidden rounded-[2rem] border border-amber-200/70 bg-[rgba(255,250,240,0.94)] p-6 shadow-[0_28px_80px_rgba(51,65,85,0.14)] sm:p-8 md:p-10">
                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(18rem,24rem)] lg:items-center">
                        {/* Left Column: Title & Mascot */}
                        <div className="flex flex-col items-center gap-5 text-center lg:items-start lg:text-left">
                            <div className="cursor-default select-none text-[clamp(4.5rem,11vw,6.5rem)] leading-none drop-shadow-[0_12px_20px_rgba(71,85,105,0.18)] motion-safe:transition-transform motion-safe:duration-300 motion-safe:hover:-translate-y-1 motion-reduce:transform-none">
                                🐢
                            </div>
                            <div className="space-y-3">
                                <h1
                                    className="text-[clamp(2.75rem,6vw,4.5rem)] font-black leading-[0.95] tracking-[-0.045em] text-slate-900"
                                    data-testid="game-title"
                                >
                                    {t("game.title")}
                                </h1>
                                <p className="mx-auto max-w-[24rem] text-[clamp(1rem,2.2vw,1.2rem)] font-medium leading-[1.45] text-slate-700 lg:mx-0">
                                    {t("menu.instructions")}
                                </p>
                            </div>

                            <div className="mt-2 w-full max-w-sm rounded-[1.75rem] border border-amber-300/70 bg-[#31291d]/92 p-5 shadow-[0_18px_46px_rgba(120,87,23,0.22)]">
                                <div className="flex flex-col items-center">
                                    <div className="mb-2 flex items-center gap-2.5">
                                        <TrophyIcon className="h-5 w-5 text-amber-300" />
                                        <span className="text-sm font-bold uppercase tracking-[0.18em] text-amber-200/90">
                                            {t("game.bestTime")}
                                        </span>
                                    </div>
                                    <div
                                        className="text-[clamp(2.25rem,5vw,3.25rem)] font-bold tracking-[-0.04em] text-amber-300 tabular-nums"
                                    >
                                        {formattedBestTime}
                                    </div>
                                    {continuousMode && (
                                        <div className="mt-3 rounded-full border border-emerald-300/25 bg-emerald-950/45 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-emerald-100">
                                            {t("game.continuousMode")}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="mx-auto flex w-full max-w-md flex-col gap-3 lg:mx-0">
                            <Button
                                size="lg"
                                className="h-[5.25rem] gap-4 rounded-[1.5rem] border border-emerald-900/10 bg-emerald-600 px-5 text-[1.35rem] font-bold text-white shadow-[0_18px_28px_rgba(22,163,74,0.24)] hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-[0_22px_34px_rgba(22,163,74,0.26)] focus-visible:ring-emerald-200/70 sm:px-6"
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
                                        subtitleClassName="mt-1 text-sm font-medium text-white/78"
                                        title={startGameLabel.title}
                                        subtitle={startGameLabel.subtitle}
                                    />
                                </span>
                            </Button>

                            <Button
                                variant="default"
                                size="lg"
                                className="h-[4.75rem] gap-4 rounded-[1.5rem] border border-blue-950/10 bg-blue-600 text-xl font-bold text-white shadow-[0_16px_24px_rgba(37,99,235,0.2)] hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-[0_20px_30px_rgba(37,99,235,0.24)]"
                                onClick={handlePlayAllLevels}
                                disabled={!canPlayAllLevels}
                                data-testid="play-all-levels-button"
                                aria-label={t("game.playAllLevels")}
                            >
                                <MenuActionButtonContent
                                    icon={<TrophyIcon className="w-6 h-6" />}
                                    iconWrapperClassName="p-2 bg-white/20 rounded-full"
                                    subtitleClassName="mt-1 text-sm font-medium text-white/78"
                                    title={playAllLevelsLabel.title}
                                    subtitle={playAllLevelsLabel.subtitle}
                                />
                            </Button>

                            <Button
                                variant="default"
                                size="lg"
                                className="h-[4.75rem] gap-4 rounded-[1.5rem] border border-slate-200 bg-[#fbf6ea] text-xl font-bold text-slate-900 shadow-[0_10px_18px_rgba(71,85,105,0.12)] hover:-translate-y-0.5 hover:bg-[#f4ecd8] hover:shadow-[0_16px_24px_rgba(71,85,105,0.16)]"
                                onClick={onShowLevels}
                                onKeyDown={(event) => handleMenuKeyDown(event, onShowLevels)}
                                data-testid="level-select-button"
                                aria-label={t("game.levelSelect")}
                            >
                                <MenuActionButtonContent
                                    icon={<GridIcon className="w-6 h-6" />}
                                    subtitleClassName="mt-1 text-sm font-medium text-slate-600"
                                    title={levelSelectLabel.title}
                                    subtitle={levelSelectLabel.subtitle}
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
