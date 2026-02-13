import { lazy, Suspense, useCallback, useMemo, useState } from "react";
import "./App.css";

import { pickRandomBackground } from "./app/backgrounds";
import { AppGameplayScene } from "./app/components/AppGameplayScene";
import { AppMenuOverlay } from "./app/components/AppMenuOverlay";
import { AppStartupGate } from "./app/components/AppStartupGate";
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
import { useLazyBackgroundPreloader } from "./lib/utils/background-preloader";

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
  const { displaySettings } = useDisplayAdjustment();

  useLazyBackgroundPreloader();
  useAppBootSignal();
  useWebVitalsMonitor();
  useRenderMeasurement();
  usePreloadResources();

  const isE2E = useE2EMode();
  const wormAutoCompleteMs = isE2E ? 12000 : undefined;

  const [timeRemaining, setTimeRemaining] = useState(10000);
  const [selectedLevel, setSelectedLevel] = useState(0);
  const [backgroundClass, setBackgroundClass] = useState(() =>
    pickRandomBackground(),
  );
  const [isLoading, setIsLoading] = useState(false);
  const [continuousMode, setContinuousMode] = useState(false);
  const [startupStep, setStartupStep] = useState<"welcome" | "menu">(
    isE2E ? "menu" : "welcome",
  );
  const [debugVisible, setDebugVisible] = useState(false);

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
    changeTargetToVisibleEmoji,
    continuousModeHighScore,
  } = useGameLogic({
    fallSpeedMultiplier: displaySettings.fallSpeed,
    continuousMode,
  });

  useFullscreenGuard(gameState.gameStarted, isE2E);
  useDebugToggle(setDebugVisible);
  useBackgroundRotation(
    gameState.gameStarted,
    gameState.winner,
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
    () => GAME_CATEGORIES.map((cat) => cat.name),
    [],
  );

  const handleWelcomeComplete = useCallback(() => {
    setStartupStep("menu");
  }, []);

  const handleToggleContinuousMode = useCallback((enabled: boolean) => {
    setContinuousMode(enabled);
  }, []);

  if (startupStep === "welcome" || isLoading) {
    return (
      <AppStartupGate
        startupStep={startupStep}
        isLoading={isLoading}
        onWelcomeComplete={handleWelcomeComplete}
        onLoadingComplete={handleLoadingComplete}
        autoCompleteAfterMs={wormAutoCompleteMs}
      />
    );
  }

  return (
    <>
      <div
        className={`h-screen overflow-hidden relative isolate app app-bg-animated ${backgroundClass}`}
      >
        <AppGameplayScene
          gameState={gameState}
          currentCategory={currentCategory}
          timeRemaining={timeRemaining}
          screenShake={screenShake}
          continuousMode={continuousMode}
          continuousModeHighScore={continuousModeHighScore}
          gameObjects={gameObjects}
          worms={worms}
          fairyTransforms={fairyTransforms}
          onResetGame={resetGame}
          onObjectTap={handleObjectTap}
          onWormTap={handleWormTap}
          onChangeTargetToVisibleEmoji={changeTargetToVisibleEmoji}
        />

        {gameState.winner && (
          <Suspense fallback={null}>
            <FireworksDisplay
              isVisible={!!gameState.winner}
              winner={gameState.winner}
            />
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
        winner={gameState.winner}
        continuousMode={continuousMode}
        onToggleContinuousMode={handleToggleContinuousMode}
        bestTime={continuousModeHighScore ?? 0}
      />
    </>
  );
}

export default App;