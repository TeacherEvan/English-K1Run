import { lazy, Suspense, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { pickRandomBackground } from "@/app/backgrounds";
import { useBackgroundRotation } from "@/app/use-background-rotation";
import { useDebugToggle } from "@/app/use-debug-toggle";
import { usePreloadResources } from "@/app/use-preload-resources";
import { useTargetTimer } from "@/app/use-target-timer";
import { AppMenuOverlay } from "@/app/components/AppMenuOverlay";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { useDisplayAdjustment } from "@/hooks/use-display-adjustment";
import { GAME_CATEGORIES, useGameLogic } from "@/hooks/use-game-logic";
import { readChallengeModeHighScores } from "@/lib/challenge-mode-high-scores";
import { getCategoryTranslationKey } from "@/lib/constants/category-translation";
import { useLazyBackgroundPreloader } from "@/lib/utils/background-preloader";

import { triggerFullscreen, useFullscreenGuard } from "../use-fullscreen-guard";

const AppGameplayScene = lazy(() =>
  import("@/app/components/AppGameplayScene").then((m) => ({
    default: m.AppGameplayScene,
  })),
);

const DefaultModeCompletionDialog = lazy(() =>
  import("../../components/game-completion/DefaultModeCompletionDialog").then(
    (m) => ({ default: m.DefaultModeCompletionDialog }),
  ),
);

const FireworksDisplay = lazy(() =>
  import("../../components/FireworksDisplay").then((m) => ({
    default: m.FireworksDisplay,
  })),
);

const EmojiRotationMonitor = lazy(() =>
  import("../../components/EmojiRotationMonitor").then((m) => ({
    default: m.EmojiRotationMonitor,
  })),
);

const WormLoadingScreen = lazy(() =>
  import("../../components/worm-loading").then((m) => ({
    default: m.WormLoadingScreen,
  })),
);

interface AppExperienceProps {
  isE2E: boolean;
}

export function AppExperience({ isE2E }: AppExperienceProps) {
  const { t } = useTranslation();
  const { displaySettings } = useDisplayAdjustment();

  const [timeRemaining, setTimeRemaining] = useState(10000);
  const [selectedLevel, setSelectedLevel] = useState(0);
  const [backgroundClass, setBackgroundClass] = useState(() =>
    pickRandomBackground(),
  );
  const [isLoading, setIsLoading] = useState(false);
  const [continuousMode, setContinuousMode] = useState(false);
  const [debugVisible, setDebugVisible] = useState(false);

  const wormAutoCompleteMs = isE2E ? 12000 : undefined;

  const {
    gameObjects,
    worms,
    fairyTransforms,
    screenShake,
    gameState,
    currentCategory,
    handleObjectTap,
    handleWormTap,
    startGame,
    resetGame,
    continuousModeHighScore,
  } = useGameLogic({
    fallSpeedMultiplier: displaySettings.fallSpeed,
    continuousMode,
  });

  usePreloadResources(!isLoading);

  useLazyBackgroundPreloader(!isLoading && !gameState.gameStarted);

  useFullscreenGuard(gameState.gameStarted, isE2E);
  useDebugToggle(setDebugVisible);
  useBackgroundRotation(
    gameState.gameStarted,
    gameState.phase === "runComplete" && gameState.winner,
    setBackgroundClass,
  );
  useTargetTimer(gameState, currentCategory, setTimeRemaining);

  const handleStartGame = useCallback(() => {
    triggerFullscreen();
    setIsLoading(true);
  }, []);

  const handleLoadingComplete = useCallback(() => {
    setIsLoading(false);
    startGame(selectedLevel);
  }, [selectedLevel, startGame]);

  const levelNames = useMemo(
    () =>
      GAME_CATEGORIES.map((cat) => {
        const categoryKey = getCategoryTranslationKey(cat.name);
        return categoryKey ? t(`categories.${categoryKey}`) : cat.name;
      }),
    [t],
  );

  const highScores = readChallengeModeHighScores();

  const handleToggleContinuousMode = useCallback((enabled: boolean) => {
    setContinuousMode(enabled);
  }, []);

  const isRunComplete = gameState.phase === "runComplete" && gameState.winner;
  const appAnimationClass = gameState.gameStarted ? "" : "app-bg-animated";

  if (isLoading) {
    return (
      <Suspense fallback={<LoadingSkeleton variant="worm" />}>
        <WormLoadingScreen
          onComplete={handleLoadingComplete}
          autoCompleteAfterMs={wormAutoCompleteMs}
        />
      </Suspense>
    );
  }

  return (
    <>
      <div
        className={`h-screen overflow-hidden relative isolate app ${appAnimationClass} ${backgroundClass}`.trim()}
      >
        <Suspense fallback={null}>
          <AppGameplayScene
            gameState={gameState}
            currentCategory={currentCategory}
            timeRemaining={timeRemaining}
            screenShake={screenShake}
            continuousMode={continuousMode}
            gameObjects={gameObjects}
            worms={worms}
            fairyTransforms={fairyTransforms}
            onResetGame={resetGame}
            onObjectTap={handleObjectTap}
            onWormTap={handleWormTap}
          />
        </Suspense>

        {isRunComplete && (
          <Suspense fallback={null}>
            <FireworksDisplay
              isVisible={isRunComplete}
              winner={isRunComplete}
            />
          </Suspense>
        )}

        {isRunComplete && gameState.runMode !== "continuous" && (
          <Suspense fallback={null}>
            <DefaultModeCompletionDialog isVisible={isRunComplete} />
          </Suspense>
        )}

        {import.meta.env.DEV && debugVisible && (
          <Suspense fallback={null}>
            <EmojiRotationMonitor />
          </Suspense>
        )}
      </div>

      <AppMenuOverlay
        onStartGame={handleStartGame}
        onSelectLevel={setSelectedLevel}
        selectedLevel={selectedLevel}
        levels={levelNames}
        gameStarted={gameState.gameStarted}
        winner={isRunComplete}
        phase={gameState.phase}
        continuousMode={continuousMode}
        onToggleContinuousMode={handleToggleContinuousMode}
        bestTargetTotal={continuousModeHighScore ?? 0}
        highScores={highScores}
      />
    </>
  );
}