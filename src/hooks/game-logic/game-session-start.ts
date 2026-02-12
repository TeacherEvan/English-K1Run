import { GAME_CATEGORIES } from "../../lib/constants/game-categories";
import { eventTracker } from "../../lib/event-tracker";
import { multiTouchHandler } from "../../lib/touch-handler";
import { setupContinuousMode } from "./continuous-mode-initialization";
import type { GameSessionDependencies } from "./game-session-types";
import { initializeWormSpawning } from "./worm-initialization";

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
    continuousModeTargetCount,
    progressiveSpawnTimeoutRefs,
    recurringSpawnIntervalRef,
    wormSpeedMultiplier,
    setContinuousModeStartTime,
    setGameObjects,
    setWorms,
    setFairyTransforms,
    setScreenShake,
    setGameState,
  } = dependencies;

  return (levelIndex?: number) => {
    try {
      const safeLevel = clampLevel(levelIndex ?? gameStateLevel);

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

      // Setup continuous mode
      setupContinuousMode({
        continuousMode,
        continuousModeTargetCount,
        setContinuousModeStartTime,
      });

      // Initialize emoji tracking
      const currentCategory = GAME_CATEGORIES[safeLevel];
      eventTracker.initializeEmojiTracking(currentCategory.items);
      eventTracker.resetPerformanceMetrics();

      // Generate initial target and reset game objects
      const target = generateRandomTarget(safeLevel);
      setGameObjects([]);
      setFairyTransforms([]);
      setScreenShake(false);

      // Initialize worm spawning
      initializeWormSpawning({
        progressiveSpawnTimeoutRefs,
        recurringSpawnIntervalRef,
        wormSpeedMultiplier,
        setWorms,
      });

      // Update game state to start the game
      setGameState((prev) => {
        const newState = {
          ...prev,
          level: safeLevel,
          gameStarted: true,
          currentTarget: target.name,
          targetEmoji: target.emoji,
          targetChangeTime: Date.now() + 10000,
          winner: false,
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

      // Spawn initial targets
      setTimeout(() => spawnImmediateTargets(), 100);
    } catch (error) {
      eventTracker.trackError(error as Error, "startGame");
    }
  };
};
