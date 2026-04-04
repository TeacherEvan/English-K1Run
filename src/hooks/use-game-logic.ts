import { useMemo } from "react";
import { useSettings } from "../context/settings-context";
import type { UseGameLogicOptions } from "../types/game";
import {
  useAnimationLoop,
  useContinuousModeRotation,
  useFairyCleanup,
  useInterLevelTransition,
  useNextCategoryPrefetch,
  useSpawnInterval,
  useTargetAnnouncement,
} from "./game-logic/game-effects";
import { createChangeTargetToVisibleEmoji } from "./game-logic/target-visibility";
import { useGameLogicInteractions } from "./use-game-logic-interactions";
import { useGameLogicResources } from "./use-game-logic-resources";
import { useGameLogicSession } from "./use-game-logic-session";
import { useGameLogicSpawn } from "./use-game-logic-spawn";
import { useGameLogicState } from "./use-game-logic-state";
import { useGameLogicTargets } from "./use-game-logic-targets";
import { useGameLogicViewport } from "./use-game-logic-viewport";
import { useSyncedRef } from "./use-synced-ref";

// Re-export for backward compatibility
export { GAME_CATEGORIES } from "../lib/constants/game-categories";
export type {
  FairyTransformObject,
  GameCategory,
  GameObject,
  GameState,
  PlayerSide,
  WormObject,
} from "../types/game";

export const useGameLogic = (options: UseGameLogicOptions = {}) => {
  const { fallSpeedMultiplier = 1, continuousMode = false } = options;
  const { reducedMotion } = useSettings();
  const {
    gameObjects,
    setGameObjects,
    worms,
    setWorms,
    fairyTransforms,
    setFairyTransforms,
    screenShake,
    setScreenShake,
    gameState,
    setGameState,
    continuousModeHighScore,
    setContinuousModeHighScore,
  } = useGameLogicState();

  const { viewportRef } = useGameLogicViewport();

  const {
    lastEmojiAppearance,
    lastTargetSpawnTime,
    targetPool,
    staleEmojisCache,
    wormSpeedMultiplier,
    progressiveSpawnTimeoutRefs,
    recurringSpawnIntervalRef,
  } = useGameLogicResources();

  const gameStateRef = useSyncedRef(gameState);
  const gameObjectsRef = useSyncedRef(gameObjects);
  const wormsRef = useSyncedRef(worms);

  const {
    clampLevel,
    currentCategory,
    generateRandomTarget,
    refillTargetPool,
  } = useGameLogicTargets({
    targetPool,
    gameStateRef,
    gameStateLevel: gameState.level,
  });

  const queuedNextLevel =
    gameState.pendingLevel ??
    gameState.levelQueue?.[(gameState.levelQueueIndex ?? -1) + 1] ??
    null;

  useTargetAnnouncement(
    gameState.gameStarted,
    gameState.phase,
    gameState.currentTarget,
    gameState.targetEmoji,
    setGameState,
  );
  useNextCategoryPrefetch(
    gameState.gameStarted,
    gameState.level,
    clampLevel,
    queuedNextLevel,
  );

  const { spawnImmediateTargets, spawnObject, updateObjects } =
    useGameLogicSpawn({
      setGameObjects,
      fallSpeedMultiplier,
      viewportRef,
      gameStateRef,
      lastEmojiAppearance,
      lastTargetSpawnTime,
      staleEmojisCache,
    });

  const { handleObjectTap, handleWormTap } = useGameLogicInteractions({
    gameObjectsRef,
    gameState,
    currentCategory,
    reducedMotion,
    generateRandomTarget,
    spawnImmediateTargets,
    continuousMode,
    refillTargetPool,
    setGameState,
    setScreenShake,
    setGameObjects,
    setWorms,
    setFairyTransforms,
    wormSpeedMultiplier,
  });

  const { startGame, resetGame } = useGameLogicSession({
    clampLevel,
    gameStateLevel: gameState.level,
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
  });

  useInterLevelTransition({
    gameState,
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
  });
  useContinuousModeRotation({
    gameState,
    continuousMode,
    continuousModeHighScore,
    setContinuousModeHighScore,
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
  });

  useSpawnInterval(
    gameState.gameStarted,
    gameState.winner,
    gameState.phase,
    spawnObject,
  );
  useAnimationLoop(
    gameState.gameStarted,
    gameState.winner,
    gameState.phase,
    updateObjects,
    setWorms,
    setGameObjects,
    viewportRef,
    wormSpeedMultiplier,
    gameObjectsRef,
    wormsRef,
  );
  useFairyCleanup(
    gameState.gameStarted,
    gameState.winner,
    gameState.phase,
    setFairyTransforms,
  );

  const changeTargetToVisibleEmoji = useMemo(
    () =>
      createChangeTargetToVisibleEmoji({
        gameObjectsRef,
        gameStateRef,
        currentCategory,
        setGameState,
        spawnImmediateTargets,
      }),
    [
      gameObjectsRef,
      gameStateRef,
      currentCategory,
      setGameState,
      spawnImmediateTargets,
    ],
  );

  return {
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
  };
};
