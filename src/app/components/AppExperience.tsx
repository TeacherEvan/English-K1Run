import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
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
import {
  getBestChallengeModeScore,
  readChallengeModeHighScores,
} from "@/lib/challenge-mode-high-scores";
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

interface AppGameplaySessionProps {
  isE2E: boolean;
  fallSpeed: number;
  selectedLevel: number;
  levels: string[];
  continuousMode: boolean;
  backgroundClass: string;
  startRequestId: number;
  onRequestStart: () => void;
  onSelectLevel: (levelIndex: number) => void;
  onSessionStateChange: (sessionState: {
    gameStarted: boolean;
    winner: boolean;
    phase: string | undefined;
  }) => void;
  onToggleContinuousMode: (enabled: boolean) => void;
  onReturnToMenu: () => void;
}

function AppGameplaySession({
  isE2E,
  fallSpeed,
  selectedLevel,
  levels,
  continuousMode,
  backgroundClass,
  startRequestId,
  onRequestStart,
  onSelectLevel,
  onSessionStateChange,
  onToggleContinuousMode,
  onReturnToMenu,
}: AppGameplaySessionProps) {
  const [timeRemaining, setTimeRemaining] = useState(10000);
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
    continuousModeHighScore,
  } = useGameLogic({
    fallSpeedMultiplier: fallSpeed,
    continuousMode,
  });

  useFullscreenGuard(gameState.gameStarted, isE2E);
  useDebugToggle(setDebugVisible);
  useTargetTimer(gameState, currentCategory, setTimeRemaining);

  useEffect(() => {
    onSessionStateChange({
      gameStarted: gameState.gameStarted,
      winner: gameState.winner,
      phase: gameState.phase,
    });
  }, [gameState.gameStarted, gameState.phase, gameState.winner, onSessionStateChange]);

  useEffect(() => {
    if (startRequestId === 0) {
      return;
    }

    startGame(selectedLevel);
  }, [selectedLevel, startGame, startRequestId]);

  const handleResetGame = useCallback(() => {
    resetGame();
    onReturnToMenu();
  }, [onReturnToMenu, resetGame]);

  const isRunComplete = gameState.phase === "runComplete" && gameState.winner;
  const appAnimationClass = gameState.gameStarted ? "" : "app-bg-animated";
  const highScores = readChallengeModeHighScores();

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
            onResetGame={handleResetGame}
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
        onStartGame={onRequestStart}
        onSelectLevel={onSelectLevel}
        selectedLevel={selectedLevel}
        levels={levels}
        gameStarted={gameState.gameStarted}
        winner={isRunComplete}
        phase={gameState.phase}
        continuousMode={continuousMode}
        onToggleContinuousMode={onToggleContinuousMode}
        bestTargetTotal={continuousModeHighScore ?? 0}
        highScores={highScores}
      />
    </>
  );
}

export function AppExperience({ isE2E }: AppExperienceProps) {
  const { t } = useTranslation();
  const { displaySettings } = useDisplayAdjustment();

  const [selectedLevel, setSelectedLevel] = useState(0);
  const [backgroundClass, setBackgroundClass] = useState(() =>
    pickRandomBackground(),
  );
  const [isLoading, setIsLoading] = useState(false);
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [startRequestId, setStartRequestId] = useState(0);
  const [continuousMode, setContinuousMode] = useState(false);
  const [sessionState, setSessionState] = useState({
    gameStarted: false,
    winner: false,
    phase: "idle" as string | undefined,
  });

  const wormAutoCompleteMs = isE2E ? 12000 : undefined;

  usePreloadResources(!isLoading);

  useLazyBackgroundPreloader(!isLoading && !hasActiveSession);
  useBackgroundRotation(
    sessionState.gameStarted,
    sessionState.phase === "runComplete" && sessionState.winner,
    setBackgroundClass,
  );

  const handleStartGame = useCallback(() => {
    triggerFullscreen();
    setHasActiveSession(true);
    setIsLoading(true);
  }, []);

  const handleLoadingComplete = useCallback(() => {
    setIsLoading(false);
    setStartRequestId((requestId) => requestId + 1);
  }, []);

  const handleReturnToMenu = useCallback(() => {
    setHasActiveSession(false);
    setIsLoading(false);
    setStartRequestId(0);
    setSessionState({ gameStarted: false, winner: false, phase: "idle" });
  }, []);

  const levelNames = useMemo(
    () =>
      GAME_CATEGORIES.map((cat) => {
        const categoryKey = getCategoryTranslationKey(cat.name);
        return categoryKey ? t(`categories.${categoryKey}`) : cat.name;
      }),
    [t],
  );

  const handleToggleContinuousMode = useCallback((enabled: boolean) => {
    setContinuousMode(enabled);
  }, []);

  const menuHighScores = readChallengeModeHighScores();
  const menuBestTargetTotal = getBestChallengeModeScore() ?? 0;

  if (isLoading) {
    return (
      <>
        {hasActiveSession && (
          <AppGameplaySession
            isE2E={isE2E}
            fallSpeed={displaySettings.fallSpeed}
            selectedLevel={selectedLevel}
            levels={levelNames}
            continuousMode={continuousMode}
            backgroundClass={backgroundClass}
            startRequestId={startRequestId}
            onRequestStart={handleStartGame}
            onSelectLevel={setSelectedLevel}
            onSessionStateChange={setSessionState}
            onToggleContinuousMode={handleToggleContinuousMode}
            onReturnToMenu={handleReturnToMenu}
          />
        )}

        <Suspense fallback={<LoadingSkeleton variant="worm" />}>
          <WormLoadingScreen
            onComplete={handleLoadingComplete}
            autoCompleteAfterMs={wormAutoCompleteMs}
          />
        </Suspense>
      </>
    );
  }

  if (hasActiveSession) {
    return (
      <AppGameplaySession
        isE2E={isE2E}
        fallSpeed={displaySettings.fallSpeed}
        selectedLevel={selectedLevel}
        levels={levelNames}
        continuousMode={continuousMode}
        backgroundClass={backgroundClass}
        startRequestId={startRequestId}
        onRequestStart={handleStartGame}
        onSelectLevel={setSelectedLevel}
        onSessionStateChange={setSessionState}
        onToggleContinuousMode={handleToggleContinuousMode}
        onReturnToMenu={handleReturnToMenu}
      />
    );
  }

  return (
    <>
      <div
        className={`h-screen overflow-hidden relative isolate app app-bg-animated ${backgroundClass}`.trim()}
      >
      </div>

      <AppMenuOverlay
        onStartGame={handleStartGame}
        onSelectLevel={setSelectedLevel}
        selectedLevel={selectedLevel}
        levels={levelNames}
        gameStarted={false}
        winner={false}
        phase="idle"
        continuousMode={continuousMode}
        onToggleContinuousMode={handleToggleContinuousMode}
        bestTargetTotal={menuBestTargetTotal}
        highScores={menuHighScores}
      />
    </>
  );
}