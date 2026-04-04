import { GAME_CATEGORIES } from "../../../lib/constants/game-categories";
import { TARGET_CHANGE_TIMEOUT_MS } from "../../../lib/constants/game-config";
import { eventTracker } from "../../../lib/event-tracker";
import { soundManager } from "../../../lib/sound-manager";
import type { GameState } from "../../../types/game";
import type { GameSessionDependencies } from "../game-session-types";
import { initializeWormSpawning } from "../worm-initialization";

type ActivateQueuedLevelDependencies = Pick<
  GameSessionDependencies,
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
> & {
  gameState?: Pick<GameState, "pendingLevel">;
  levelIndex?: number;
  stateUpdates?: Partial<GameState>;
};

export const activateQueuedLevel = ({
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
  levelIndex,
  stateUpdates,
}: ActivateQueuedLevelDependencies) => {
  const activeLevel = levelIndex ?? gameState?.pendingLevel;
  if (activeLevel === null || activeLevel === undefined) return;

  const currentCategory = GAME_CATEGORIES[activeLevel];
  if (currentCategory.requiresSequence) currentCategory.sequenceIndex = 0;

  lastEmojiAppearance.current.clear();
  targetPool.current = [];
  eventTracker.initializeEmojiTracking(currentCategory.items);
  eventTracker.resetPerformanceMetrics();

  const target = generateRandomTarget(activeLevel);
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
    level: activeLevel,
    gameStarted: true,
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
    ...stateUpdates,
  }));

  window.setTimeout(() => spawnImmediateTargets(), 100);
};
