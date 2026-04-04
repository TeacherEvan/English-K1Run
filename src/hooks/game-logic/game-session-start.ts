import { GAME_CATEGORIES } from "../../lib/constants/game-categories";
import {
  getContinuousModeLevelDurationMs,
  LEVEL_START_COUNTDOWN_MS,
} from "../../lib/constants/game-config";
import { eventTracker } from "../../lib/event-tracker";
import { soundManager } from "../../lib/sound-manager";
import { multiTouchHandler } from "../../lib/touch-handler";
import type { GameState } from "../../types/game";
import { createContinuousModeLevelQueue } from "./create-continuous-mode-level-queue";
import { createDefaultModeLevelQueue } from "./default-mode-level-queue";
import { activateQueuedLevel } from "./game-effects/activate-queued-level";
import type { GameSessionDependencies } from "./game-session-types";

/**
 * Creates the start game handler.
 */
export const createStartGame = (dependencies: GameSessionDependencies) => {
  const {
    clampLevel,
    gameStateLevel,
    continuousMode,
    generateRandomTarget,
    spawnImmediateTargets,
    lastEmojiAppearance,
    targetPool,
    progressiveSpawnTimeoutRefs,
    recurringSpawnIntervalRef,
    wormSpeedMultiplier,
    setGameObjects,
    setWorms,
    setFairyTransforms,
    setScreenShake,
    setGameState,
  } = dependencies;

  return (levelIndex?: number) => {
    try {
      const safeLevel = clampLevel(levelIndex ?? gameStateLevel);
      const levelQueue = continuousMode
        ? createContinuousModeLevelQueue(safeLevel, GAME_CATEGORIES.length)
        : createDefaultModeLevelQueue(safeLevel, GAME_CATEGORIES.length);

      // Enable touch handling and performance monitoring
      multiTouchHandler.enable();
      eventTracker.startPerformanceMonitoring();

      // Initialize sequence for sequence-based categories
      if (GAME_CATEGORIES[safeLevel].requiresSequence) {
        GAME_CATEGORIES[safeLevel].sequenceIndex = 0;
      }

      // Reset game state tracking
      lastEmojiAppearance.current.clear();
      targetPool.current = [];

      // Initialize emoji tracking
      const currentCategory = GAME_CATEGORIES[safeLevel];
      eventTracker.resetPerformanceMetrics();

      // Prefetch audio and reset visible objects before the countdown begins.
      void soundManager.prefetchAudioKeys(
        currentCategory.items.map((item) => item.name),
      );
      setGameObjects([]);
      setWorms([]);
      setFairyTransforms([]);
      setScreenShake(false);

      if (continuousMode) {
        const levelDurationMs = getContinuousModeLevelDurationMs();
        activateQueuedLevel({
          generateRandomTarget,
          spawnImmediateTargets,
          lastEmojiAppearance,
          targetPool,
          progressiveSpawnTimeoutRefs,
          recurringSpawnIntervalRef,
          wormSpeedMultiplier,
          setGameObjects,
          setWorms,
          setFairyTransforms,
          setScreenShake,
          setGameState,
          levelIndex: safeLevel,
          stateUpdates: {
            runMode: "continuous",
            levelQueue,
            levelQueueIndex: 0,
            continuousCategoryClearCount: 0,
            continuousLevelEndsAt: Date.now() + levelDurationMs,
            continuousRunScore: 0,
          },
        });
        return;
      }

      // Update game state to start the countdown-first flow.
      setGameState((prev) => {
        const newState: GameState = {
          ...prev,
          level: safeLevel,
          gameStarted: true,
          runMode: "default",
          currentTarget: "",
          targetEmoji: "",
          targetChangeTime: 0,
          winner: false,
          phase: "interLevelCountdown",
          pendingLevel: safeLevel,
          countdownEndsAt: Date.now() + LEVEL_START_COUNTDOWN_MS,
          levelCompleteEndsAt: null,
          levelQueue,
          levelQueueIndex: 0,
          targetsClearedThisLevel: 0,
          continuousCategoryClearCount: 0,
          continuousLevelEndsAt: null,
          continuousRunScore: 0,
          progress: 0,
          streak: 0,
        };
        eventTracker.trackGameStateChange(
          { ...prev },
          { ...newState },
          "game_start",
        );
        return newState;
      });
    } catch (error) {
      eventTracker.trackError(error as Error, "startGame");
    }
  };
};
