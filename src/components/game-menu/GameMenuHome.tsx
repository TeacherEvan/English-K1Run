import { memo } from "react";
import type { ResolutionScale } from "../../context/settings-context";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { GameMenuCreditsDialog } from "./GameMenuCreditsDialog";
import { GameMenuExitDialog } from "./GameMenuExitDialog";
import { GameMenuSettingsDialog } from "./GameMenuSettingsDialog";
import {
    GridIcon,
    PlayIcon,
    TrophyIcon,
} from "./icons";
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
        return (
            <div
                className="absolute inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300"
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
                                    Kindergarten Race
                                </h1>
                                <h2 className="text-2xl md:text-3xl font-semibold text-primary/80 font-thai">
                                    การแข่งขันอนุบาล
                                </h2>
                            </div>

                            {/* Best Times Display */}
                            <div className="mt-8 p-6 bg-black/80 rounded-2xl border-2 border-yellow-500/50 shadow-[0_0_30px_rgba(234,179,8,0.2)] w-full max-w-xs transform hover:scale-105 transition-transform duration-300 group">
                                <div className="flex flex-col items-center">
                                    <div className="flex items-center gap-2 mb-2">
                                        <TrophyIcon className="w-5 h-5 text-yellow-500 group-hover:rotate-12 transition-transform" />
                                        <span className="text-yellow-500 font-bold uppercase tracking-widest text-sm">
                                            Best Time
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
                                            Continuous Mode
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Menu Actions */}
                        <div className="flex flex-col gap-3 w-full max-w-sm mx-auto">
                            {/* 1. START GAME Button */}
                            <Button
                                size="lg"
                                className="h-20 text-2xl font-bold shadow-lg hover:scale-105 hover:shadow-primary/25 transition-all duration-200 gap-4 border-b-4 border-primary-foreground/20 active:border-b-0 active:translate-y-1 bg-green-600 hover:bg-green-700 text-white"
                                onClick={onStartGame}
                                data-testid="start-game-button"
                                aria-label="Start Game Immediately"
                            >
                                <MenuActionButtonContent
                                    icon={<PlayIcon className="w-6 h-6 fill-current" />}
                                    iconWrapperClassName="p-2 bg-white/20 rounded-full"
                                    title="Start Game"
                                    subtitle="เริ่มเกม"
                                />
                            </Button>

                            {/* 2. LEVEL SELECT Button */}
                            <Button
                                variant="default"
                                size="lg"
                                className="h-16 text-xl font-bold shadow-md hover:scale-105 transition-all duration-200 gap-4"
                                onClick={onShowLevels}
                                data-testid="level-select-button"
                                aria-label="Go to Level Selection"
                            >
                                <MenuActionButtonContent
                                    icon={<GridIcon className="w-6 h-6" />}
                                    title="Level Select"
                                    subtitle="เลือกระดับ"
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
