import { lazy, Suspense, useCallback, useMemo, useState } from "react";
import "./App.css";

import { useTranslation } from "react-i18next";
import { pickRandomBackground } from "./app/backgrounds";
import { AppGameplayScene } from "./app/components/AppGameplayScene";
import { AppMenuOverlay } from "./app/components/AppMenuOverlay";
import { AppStartupGate } from "./app/components/AppStartupGate";
import { useStartupBoot } from "./app/startup/use-startup-boot";
import { useAppBootSignal } from "./app/use-app-boot";
import { useBackgroundRotation } from "./app/use-background-rotation";
import { useDebugToggle } from "./app/use-debug-toggle";
import { useE2EMode } from "./app/use-e2e-mode";
import { triggerFullscreen, useFullscreenGuard } from "./app/use-fullscreen-guard";
import { usePreloadResources } from "./app/use-preload-resources";
import { useRenderMeasurement } from "./app/use-render-measurement";
import { useTargetTimer } from "./app/use-target-timer";
import { useWebVitalsMonitor } from "./app/use-web-vitals-monitor";
import { useDisplayAdjustment } from "./hooks/use-display-adjustment";
import { GAME_CATEGORIES, useGameLogic } from "./hooks/use-game-logic";
import { getCategoryTranslationKey } from "./lib/constants/category-translation";
import { readChallengeModeHighScores } from "./lib/challenge-mode-high-scores";
import { useLazyBackgroundPreloader } from "./lib/utils/background-preloader";

const DefaultModeCompletionDialog = lazy(() =>
  import("./components/game-completion/DefaultModeCompletionDialog").then(
    (m) => ({ default: m.DefaultModeCompletionDialog }),
  ),
);

const FireworksDisplay = lazy(() =>
  import("./components/FireworksDisplay").then((m) => ({
    default: m.FireworksDisplay,
  })),
);
const EmojiRotationMonitor = lazy(() =>
  import("./components/EmojiRotationMonitor").then((m) => ({
    default: m.EmojiRotationMonitor,
  })),
);

function App() {
  const { t } = useTranslation();
  const { displaySettings } = useDisplayAdjustment();
  const isE2E = useE2EMode();

  const [timeRemaining, setTimeRemaining] = useState(10000);
  const [selectedLevel, setSelectedLevel] = useState(0);
  const [backgroundClass, setBackgroundClass] = useState(() =>
    pickRandomBackground(),
  );
  const [isLoading, setIsLoading] = useState(false);
  const [continuousMode, setContinuousMode] = useState(false);
  const [startupStep, setStartupStep] = useState<"boot" | "welcome" | "menu">(
    isE2E ? "menu" : "boot",
  );
  const [debugVisible, setDebugVisible] = useState(false);

  useAppBootSignal();
  useWebVitalsMonitor();
  useRenderMeasurement();

  const startupBoot = useStartupBoot(!isE2E && startupStep === "boot");
  const effectiveStartupStep =
    startupStep === "boot" && startupBoot.ready ? "welcome" : startupStep;

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

  usePreloadResources(startupStep === "menu" && !isLoading);

  useLazyBackgroundPreloader(
    startupStep === "menu" && !isLoading && !gameState.gameStarted,
  );

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

  const handleWelcomeComplete = useCallback(() => {
    setStartupStep("menu");
  }, []);

  const handleToggleContinuousMode = useCallback((enabled: boolean) => {
    setContinuousMode(enabled);
  }, []);

  const isRunComplete = gameState.phase === "runComplete" && gameState.winner;

  const appAnimationClass = gameState.gameStarted ? "" : "app-bg-animated";

  if (effectiveStartupStep === "boot" || effectiveStartupStep === "welcome" || isLoading) {
    return (
      <AppStartupGate
        startupStep={effectiveStartupStep}
        isLoading={isLoading}
        onWelcomeComplete={handleWelcomeComplete}
        onLoadingComplete={handleLoadingComplete}
        autoCompleteAfterMs={wormAutoCompleteMs}
        bootPercentage={startupBoot.percentage}
        bootPhase={startupBoot.phase}
        bootLabel={startupBoot.label}
      />
    );
  }

  return (
    <>
      <div
        className={`h-screen overflow-hidden relative isolate app ${appAnimationClass} ${backgroundClass}`.trim()}
      >
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

export default App;