import { useEffect } from "react";
import { GAME_CATEGORIES } from "../../../lib/constants/game-categories";
import {
  LEVEL_COMPLETE_POPUP_MS,
  LEVEL_START_COUNTDOWN_MS,
  TARGET_CHANGE_TIMEOUT_MS,
} from "../../../lib/constants/game-config";
import { eventTracker } from "../../../lib/event-tracker";
import { soundManager } from "../../../lib/sound-manager";
import type { GameState } from "../../../types/game";
import type { GameSessionDependencies } from "../game-session-types";
import { initializeWormSpawning } from "../worm-initialization";

type InterLevelTransitionDependencies = Pick<
  GameSessionDependencies,
  | "continuousMode"
  | "generateRandomTarget"
  | "spawnImmediateTargets"
  | "lastEmojiAppearance"
  | "targetPool"
  | "progressiveSpawnTimeoutRefs"
  | "recurringSpawnIntervalRef"
  | "wormSpeedMultiplier"
  | "setGameObjects"
  | "setWorms"
  | "setFairyTransforms"
  | "setScreenShake"
  | "setGameState"
> & { gameState: GameState };

const activateQueuedLevel = ({
  gameState,
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
}: InterLevelTransitionDependencies) => {
  const levelIndex = gameState.pendingLevel;
  if (levelIndex === null || levelIndex === undefined) return;

  const currentCategory = GAME_CATEGORIES[levelIndex];
  if (currentCategory.requiresSequence) {
    currentCategory.sequenceIndex = 0;
  }

  progressiveSpawnTimeoutRefs.current.forEach((timeout) =>
    clearTimeout(timeout),
  );
  progressiveSpawnTimeoutRefs.current = [];
  if (recurringSpawnIntervalRef.current) {
    clearInterval(recurringSpawnIntervalRef.current);
  }

  lastEmojiAppearance.current.clear();
  targetPool.current = [];
  eventTracker.initializeEmojiTracking(currentCategory.items);
  eventTracker.resetPerformanceMetrics();

  const target = generateRandomTarget(levelIndex);
  void soundManager.prefetchAudioKeys([target.name]);
  void soundManager.prefetchAudioKeys(
    currentCategory.items.map((item) => item.name),
  );

  setGameObjects([]);
  setWorms([]);
  setFairyTransforms([]);
  setScreenShake(false);
  initializeWormSpawning({
    progressiveSpawnTimeoutRefs,
    recurringSpawnIntervalRef,
    wormSpeedMultiplier,
    setWorms,
  });

  setGameState((prev) => ({
    ...prev,
    level: levelIndex,
    currentTarget: target.name,
    targetEmoji: target.emoji,
    targetChangeTime: Date.now() + TARGET_CHANGE_TIMEOUT_MS,
    phase: "playing",
    pendingLevel: null,
    countdownEndsAt: null,
    levelCompleteEndsAt: null,
    winner: false,
    progress: 0,
    streak: 0,
    targetsClearedThisLevel: 0,
  }));

  window.setTimeout(() => spawnImmediateTargets(), 100);
};

export const useInterLevelTransition = (
  dependencies: InterLevelTransitionDependencies,
) => {
  const { gameState, setGameState } = dependencies;

  useEffect(() => {
    if (
      gameState.phase !== "levelComplete" ||
      gameState.levelCompleteEndsAt === null ||
      gameState.levelCompleteEndsAt === undefined
    ) {
      return;
    }

    const delay = Math.max(gameState.levelCompleteEndsAt - Date.now(), 0);
    const timeout = window.setTimeout(() => {
      setGameState((prev) => {
        if (prev.phase !== "levelComplete") return prev;
        return {
          ...prev,
          phase: "interLevelCountdown",
          countdownEndsAt: Date.now() + LEVEL_START_COUNTDOWN_MS,
          levelCompleteEndsAt: null,
        };
      });
    }, delay);

    return () => window.clearTimeout(timeout);
  }, [gameState.levelCompleteEndsAt, gameState.phase, setGameState]);

  useEffect(() => {
    if (
      gameState.phase !== "interLevelCountdown" ||
      gameState.pendingLevel === null ||
      gameState.pendingLevel === undefined ||
      gameState.countdownEndsAt === null ||
      gameState.countdownEndsAt === undefined
    ) {
      return;
    }

    const delay = Math.max(gameState.countdownEndsAt - Date.now(), 0);
    const timeout = window.setTimeout(() => {
      activateQueuedLevel(dependencies);
    }, delay);

    return () => window.clearTimeout(timeout);
  }, [
    dependencies,
    gameState.countdownEndsAt,
    gameState.pendingLevel,
    gameState.phase,
  ]);
};

export const INTER_LEVEL_TIMINGS = {
  popupMs: LEVEL_COMPLETE_POPUP_MS,
  countdownMs: LEVEL_START_COUNTDOWN_MS,
};
