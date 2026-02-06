import { lazy, Suspense } from "react";
import { CategoryErrorBoundary } from "../../components/CategoryErrorBoundary";
import { FallingObject } from "../../components/FallingObject";
import { PlayerArea } from "../../components/PlayerArea";
import { Stopwatch } from "../../components/Stopwatch";
import { TargetAnnouncementOverlay } from "../../components/TargetAnnouncementOverlay";
import { TargetDisplay } from "../../components/TargetDisplay";
import { Worm } from "../../components/Worm";
import type {
    FairyTransformObject,
    GameCategory,
    GameObject,
    GameState,
    WormObject,
} from "../../hooks/use-game-logic";
import { eventTracker } from "../../lib/event-tracker";

const FairyTransformation = lazy(() =>
    import("../../components/FairyTransformation").then((m) => ({
        default: m.FairyTransformation,
    })),
);

interface AppGameplaySceneProps {
    gameState: GameState;
    currentCategory: GameCategory;
    timeRemaining: number;
    screenShake: boolean;
    continuousMode: boolean;
    continuousModeHighScore: number | null;
    gameObjects: GameObject[];
    worms: WormObject[];
    fairyTransforms: FairyTransformObject[];
    onResetGame: () => void;
    onObjectTap: (objectId: string, playerSide: "left" | "right") => void;
    onWormTap: (wormId: string, playerSide: "left" | "right") => void;
    onChangeTargetToVisibleEmoji: () => void;
}

/**
 * AppGameplayScene - Renders the active gameplay UI.
 */
export const AppGameplayScene = ({
    gameState,
    currentCategory,
    timeRemaining,
    screenShake,
    continuousMode,
    continuousModeHighScore,
    gameObjects,
    worms,
    fairyTransforms,
    onResetGame,
    onObjectTap,
    onWormTap,
    onChangeTargetToVisibleEmoji,
}: AppGameplaySceneProps) => {
    const isActive = gameState.gameStarted && !gameState.winner;

    return (
        <>
            {isActive && (
                <div className="absolute top-4 left-4 z-40">
                    <button
                        data-testid="back-button"
                        onClick={onResetGame}
                        className="bg-primary/90 hover:bg-primary text-primary-foreground font-semibold rounded-lg shadow-lg transition-all hover:scale-105 backdrop-blur-sm border-2 border-primary-foreground/20"
                        style={{
                            fontSize: `calc(0.875rem * var(--font-scale, 1))`,
                            padding: `calc(0.5rem * var(--spacing-scale, 1)) calc(1rem * var(--spacing-scale, 1))`,
                        }}
                    >
                        ← Back to Levels
                    </button>
                </div>
            )}

            {isActive && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30 w-32">
                    <TargetDisplay
                        currentTarget={gameState.currentTarget}
                        targetEmoji={gameState.targetEmoji}
                        category={currentCategory}
                        timeRemaining={
                            currentCategory.requiresSequence ? undefined : timeRemaining
                        }
                        onClick={
                            currentCategory.requiresSequence
                                ? undefined
                                : onChangeTargetToVisibleEmoji
                        }
                    />
                </div>
            )}

            {isActive && (
                <TargetAnnouncementOverlay
                    emoji={gameState.announcementEmoji || gameState.targetEmoji}
                    sentence={gameState.announcementSentence || ""}
                    isVisible={Boolean(gameState.announcementActive)}
                />
            )}

            {isActive && continuousMode && (
                <Stopwatch
                    isRunning={!gameState.winner}
                    bestTime={continuousModeHighScore ?? 0}
                />
            )}

            <CategoryErrorBoundary
                category="rendering"
                enableSafeMode
                onError={(error, _errorInfo, category) => {
                    eventTracker.trackError(error, `rendering-${category}`);
                }}
            >
                <div className={`h-full ${screenShake ? "screen-shake" : ""}`}>
                    <PlayerArea
                        playerNumber={1}
                        progress={gameState.progress}
                        isWinner={gameState.winner}
                    >
                        {gameObjects.map((obj) => (
                            <FallingObject
                                key={obj.id}
                                object={obj}
                                onTap={onObjectTap}
                                playerSide={obj.lane}
                            />
                        ))}
                        {worms.map((worm) => (
                            <Worm
                                key={worm.id}
                                worm={worm}
                                onTap={onWormTap}
                                playerSide={worm.lane}
                            />
                        ))}
                        {fairyTransforms.map((fairy) => (
                            <Suspense key={fairy.id} fallback={null}>
                                <FairyTransformation fairy={fairy} />
                            </Suspense>
                        ))}
                    </PlayerArea>
                </div>
            </CategoryErrorBoundary>
        </>
    );
};
