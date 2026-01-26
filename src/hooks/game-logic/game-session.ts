/**
 * Game Session Handlers
 */

import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import { GAME_CATEGORIES } from "../../lib/constants/game-categories";
import {
  WORM_INITIAL_COUNT,
  WORM_PROGRESSIVE_SPAWN_INTERVAL,
  WORM_RECURRING_COUNT,
  WORM_RECURRING_INTERVAL,
} from "../../lib/constants/game-config";
import { eventTracker } from "../../lib/event-tracker";
import { multiTouchHandler } from "../../lib/touch-handler";
import type {
  ComboCelebration,
  FairyTransformObject,
  GameObject,
  GameState,
  WormObject,
} from "../../types/game";
import { createWorms } from "./worm-logic";

export interface GameSessionDependencies {
  clampLevel: (levelIndex: number) => number;
  gameStateLevel: number;
  continuousMode: boolean;
  generateRandomTarget: (levelOverride?: number) => {
    name: string;
    emoji: string;
  };
  spawnImmediateTargets: () => void;
  lastEmojiAppearance: MutableRefObject<Map<string, number>>;
  targetPool: MutableRefObject<Array<{ emoji: string; name: string }>>;
  continuousModeTargetCount: MutableRefObject<number>;
  progressiveSpawnTimeoutRefs: MutableRefObject<NodeJS.Timeout[]>;
  recurringSpawnIntervalRef: MutableRefObject<NodeJS.Timeout | undefined>;
  wormSpeedMultiplier: MutableRefObject<number>;
  setContinuousModeStartTime: Dispatch<SetStateAction<number | null>>;
  setGameObjects: Dispatch<SetStateAction<GameObject[]>>;
  setWorms: Dispatch<SetStateAction<WormObject[]>>;
  setFairyTransforms: Dispatch<SetStateAction<FairyTransformObject[]>>;
  setScreenShake: Dispatch<SetStateAction<boolean>>;
  setGameState: Dispatch<SetStateAction<GameState>>;
  setComboCelebration: Dispatch<SetStateAction<ComboCelebration | null>>;
}

export const createGameSessionHandlers = (
  dependencies: GameSessionDependencies,
) => {
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
    setComboCelebration,
  } = dependencies;

  const startGame = (levelIndex?: number) => {
    try {
      const safeLevel = clampLevel(levelIndex ?? gameStateLevel);

      multiTouchHandler.enable();
      eventTracker.startPerformanceMonitoring();

      if (GAME_CATEGORIES[safeLevel].requiresSequence) {
        GAME_CATEGORIES[safeLevel].sequenceIndex = 0;
      }

      lastEmojiAppearance.current.clear();
      targetPool.current = [];
      continuousModeTargetCount.current = 0;

      if (continuousMode) {
        setContinuousModeStartTime(Date.now());
      }

      const currentCategory = GAME_CATEGORIES[safeLevel];
      eventTracker.initializeEmojiTracking(currentCategory.items);
      eventTracker.resetPerformanceMetrics();

      const target = generateRandomTarget(safeLevel);
      setGameObjects([]);
      setFairyTransforms([]);
      setScreenShake(false);

      progressiveSpawnTimeoutRefs.current.forEach((timeout) =>
        clearTimeout(timeout),
      );
      progressiveSpawnTimeoutRefs.current = [];
      if (recurringSpawnIntervalRef.current) {
        clearInterval(recurringSpawnIntervalRef.current);
      }

      setWorms([]);
      wormSpeedMultiplier.current = 1;

      for (let i = 0; i < WORM_INITIAL_COUNT; i++) {
        const timeout = setTimeout(() => {
          setWorms((prev) => [...prev, ...createWorms(1, i)]);
          eventTracker.trackEvent({
            type: "info",
            category: "worm",
            message: `Progressive spawn: worm ${i + 1}/${WORM_INITIAL_COUNT}`,
            data: { wormIndex: i },
          });
        }, i * WORM_PROGRESSIVE_SPAWN_INTERVAL);
        progressiveSpawnTimeoutRefs.current.push(timeout);
      }

      recurringSpawnIntervalRef.current = setInterval(() => {
        setWorms((prev) => {
          const aliveCount = prev.filter((w) => w.alive).length;
          const newWorms = createWorms(WORM_RECURRING_COUNT, prev.length);

          eventTracker.trackEvent({
            type: "info",
            category: "worm",
            message: `Recurring spawn: ${WORM_RECURRING_COUNT} worms (${aliveCount} already alive)`,
            data: {
              recurringSpawn: true,
              aliveCount,
              newCount: WORM_RECURRING_COUNT,
            },
          });

          return [...prev, ...newWorms];
        });
      }, WORM_RECURRING_INTERVAL);

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
      setComboCelebration(null);

      setTimeout(() => spawnImmediateTargets(), 100);
    } catch (error) {
      eventTracker.trackError(error as Error, "startGame");
    }
  };

  const resetGame = () => {
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
    setComboCelebration(null);
  };

  return { startGame, resetGame };
};
