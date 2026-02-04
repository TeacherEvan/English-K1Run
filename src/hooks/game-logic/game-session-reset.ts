import { GAME_CATEGORIES } from "../../lib/constants/game-categories";
import { eventTracker } from "../../lib/event-tracker";
import { multiTouchHandler } from "../../lib/touch-handler";
import type { GameSessionDependencies } from "./game-session-types";

/**
 * Creates the reset game handler.
 */
export const createResetGame = (dependencies: GameSessionDependencies) => {
  const {
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

  return () => {
    GAME_CATEGORIES.forEach((cat) => {
      cat.sequenceIndex = 0;
    });

    multiTouchHandler.disable();
    eventTracker.stopPerformanceMonitoring();

    lastEmojiAppearance.current.clear();
    targetPool.current = [];
    eventTracker.resetPerformanceMetrics();

    progressiveSpawnTimeoutRefs.current.forEach((timeout) =>
      clearTimeout(timeout),
    );
    progressiveSpawnTimeoutRefs.current = [];
    if (recurringSpawnIntervalRef.current) {
      clearInterval(recurringSpawnIntervalRef.current);
    }

    setGameObjects([]);
    setWorms([]);
    setFairyTransforms([]);
    setScreenShake(false);
    wormSpeedMultiplier.current = 1;

    setGameState({
      progress: 0,
      currentTarget: "",
      targetEmoji: "",
      level: 0,
      gameStarted: false,
      winner: false,
      targetChangeTime: Date.now() + 10000,
      streak: 0,
    });
  };
};
