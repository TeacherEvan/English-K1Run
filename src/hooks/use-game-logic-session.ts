import { useMemo } from "react";
import type { GameSessionDependencies } from "./game-logic/game-session";
import { createGameSessionHandlers } from "./game-logic/game-session";

/**
 * Builds game session start/reset handlers.
 */
export const useGameLogicSession = ({
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
}: GameSessionDependencies) => {
  const { startGame, resetGame } = useMemo(
    () =>
      createGameSessionHandlers({
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
      }),
    [
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
    ],
  );

  return { startGame, resetGame };
};
