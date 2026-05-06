import { lazy, Suspense } from "react";
import type { ChallengeModeHighScoreEntry } from "@/lib/challenge-mode-high-scores";
import type { GameMenuCompactLayout } from "@/components/game-menu/menu-layout-mode";
import { LoadingSkeleton } from "../../components/LoadingSkeleton";
import { UI_LAYER_MATRIX } from "../../lib/constants/ui-layer-matrix";
import type { GamePhase } from "../../types/game";

const GameMenu = lazy(() =>
    import("../../components/GameMenu").then((m) => ({ default: m.GameMenu })),
);

interface AppMenuOverlayProps {
    onStartGame: () => void;
    onSelectLevel: (levelIndex: number) => void;
    selectedLevel: number;
    compactLayout: GameMenuCompactLayout;
    levels: string[];
    gameStarted: boolean;
    winner: boolean;
    phase?: GamePhase;
    continuousMode: boolean;
    onToggleContinuousMode: (enabled: boolean) => void;
    bestTargetTotal: number;
    highScores: ChallengeModeHighScoreEntry[];
}

/**
 * AppMenuOverlay - Renders the main menu layer.
 */
export const AppMenuOverlay = ({
    onStartGame,
    onSelectLevel,
    selectedLevel,
    compactLayout,
    levels,
    gameStarted,
    winner,
    phase,
    continuousMode,
    onToggleContinuousMode,
    bestTargetTotal,
    highScores,
}: AppMenuOverlayProps) => (
    <div
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: UI_LAYER_MATRIX.MENU_OVERLAY }}
    >
        <div className="pointer-events-auto">
            <Suspense fallback={<LoadingSkeleton variant="menu" />}>
                <GameMenu
                    onStartGame={onStartGame}
                    onSelectLevel={onSelectLevel}
                    selectedLevel={selectedLevel}
                    compactLayout={compactLayout}
                    levels={levels}
                    gameStarted={gameStarted}
                    winner={winner}
                    phase={phase}
                    continuousMode={continuousMode}
                    onToggleContinuousMode={onToggleContinuousMode}
                    bestTargetTotal={bestTargetTotal}
                    highScores={highScores}
                    initialView="main"
                />
            </Suspense>
        </div>
    </div>
);
