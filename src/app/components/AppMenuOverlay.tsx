import { lazy, Suspense } from "react";
import { LoadingSkeleton } from "../../components/LoadingSkeleton";
import { UI_LAYER_MATRIX } from "../../lib/constants/ui-layer-matrix";

const GameMenu = lazy(() =>
    import("../../components/GameMenu").then((m) => ({ default: m.GameMenu })),
);

interface AppMenuOverlayProps {
    onStartGame: () => void;
    onSelectLevel: (levelIndex: number) => void;
    selectedLevel: number;
    levels: string[];
    gameStarted: boolean;
    winner: boolean;
    continuousMode: boolean;
    onToggleContinuousMode: (enabled: boolean) => void;
    bestTime: number;
}

/**
 * AppMenuOverlay - Renders the main menu layer.
 */
export const AppMenuOverlay = ({
    onStartGame,
    onSelectLevel,
    selectedLevel,
    levels,
    gameStarted,
    winner,
    continuousMode,
    onToggleContinuousMode,
    bestTime,
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
                    levels={levels}
                    gameStarted={gameStarted}
                    winner={winner}
                    continuousMode={continuousMode}
                    onToggleContinuousMode={onToggleContinuousMode}
                    bestTime={bestTime}
                    initialView="main"
                />
            </Suspense>
        </div>
    </div>
);
