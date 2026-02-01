import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GAME_CATEGORIES } from "../lib/constants/game-categories";
import type {
  FairyTransformObject,
  GameObject,
  GameState,
  UseGameLogicOptions,
  WormObject,
} from "../types/game";
import {
  useAnimationLoop,
  useFairyCleanup,
  useNextCategoryPrefetch,
  useSpawnInterval,
  useTargetAnnouncement,
  useViewportObserver,
} from "./game-logic/game-effects";
import { createGameSessionHandlers } from "./game-logic/game-session";
import { createObjectUpdater } from "./game-logic/object-update";
import { createSpawnHandlers } from "./game-logic/spawn-objects";
import {
  createHandleObjectTap,
  createHandleWormTap,
} from "./game-logic/tap-handlers";
import { createTargetPoolManager } from "./game-logic/target-pool";
import { createChangeTargetToVisibleEmoji } from "./game-logic/target-visibility";
import { useDisplayAdjustment } from "./use-display-adjustment";

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
  const [gameObjects, setGameObjects] = useState<GameObject[]>([]);
  const [worms, setWorms] = useState<WormObject[]>([]);
  const [fairyTransforms, setFairyTransforms] = useState<
    FairyTransformObject[]
  >([]);
  const [screenShake, setScreenShake] = useState(false);
  const [gameState, setGameState] = useState<GameState>(() => ({
    progress: 0,
    currentTarget: "",
    targetEmoji: "",
    level: 0,
    gameStarted: false,
    winner: false,
    targetChangeTime: 0,
    streak: 0,
    announcementActive: false,
    announcementEmoji: "",
    announcementSentence: "",
    multiplier: 1.0,
    lastMilestone: 0,
  }));

  const continuousModeTargetCount = useRef(0);
  const [continuousModeStartTime, setContinuousModeStartTime] = useState<
    number | null
  >(null);
  const [continuousModeHighScore, setContinuousModeHighScore] = useState<
    number | null
  >(() => {
    if (typeof localStorage === "undefined") return null;
    const stored = localStorage.getItem("continuousModeHighScore");
    return stored ? parseInt(stored, 10) : null;
  });

  const viewportRef = useRef({ width: 1920, height: 1080 });
  const { triggerResizeUpdate } = useDisplayAdjustment();
  useViewportObserver(viewportRef, triggerResizeUpdate);

  const lastEmojiAppearance = useRef<Map<string, number>>(new Map());
  const lastTargetSpawnTime = useRef(0);
  const targetPool = useRef<Array<{ emoji: string; name: string }>>([]);
  const staleEmojisCache = useRef<{
    emojis: Array<{ emoji: string; name: string }>;
    timestamp: number;
  }>({
    emojis: [],
    timestamp: 0,
  });

  const gameStateRef = useRef(gameState);
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  const gameObjectsRef = useRef<GameObject[]>(gameObjects);
  useEffect(() => {
    gameObjectsRef.current = gameObjects;
  }, [gameObjects]);

  const wormsRef = useRef<WormObject[]>(worms);
  useEffect(() => {
    wormsRef.current = worms;
  }, [worms]);

  const wormSpeedMultiplier = useRef(1);
  const progressiveSpawnTimeoutRefs = useRef<NodeJS.Timeout[]>([]);
  const recurringSpawnIntervalRef = useRef<NodeJS.Timeout | undefined>(
    undefined,
  );

  const clampLevel = useCallback((levelIndex: number) => {
    if (Number.isNaN(levelIndex)) return 0;
    return Math.max(0, Math.min(levelIndex, GAME_CATEGORIES.length - 1));
  }, []);

  const { generateRandomTarget, refillTargetPool } = useMemo(
    () =>
      createTargetPoolManager({
        targetPoolRef: targetPool,
        clampLevel,
        getLevel: () => gameStateRef.current.level,
      }),
    [clampLevel],
  );

  const currentCategory = useMemo(
    () => GAME_CATEGORIES[gameState.level] || GAME_CATEGORIES[0],
    [gameState.level],
  );

  useTargetAnnouncement(
    gameState.gameStarted,
    gameState.currentTarget,
    gameState.targetEmoji,
    setGameState,
  );
  useNextCategoryPrefetch(gameState.gameStarted, gameState.level, clampLevel);

  const { spawnImmediateTargets, spawnObject } = useMemo(
    () =>
      createSpawnHandlers({
        setGameObjects,
        fallSpeedMultiplier,
        gameStateRef,
        lastEmojiAppearance,
        lastTargetSpawnTime,
        staleEmojisCache,
      }),
    [fallSpeedMultiplier],
  );

  const { updateObjects } = useMemo(
    () =>
      createObjectUpdater({
        setGameObjects,
        viewportRef,
        gameStateRef,
      }),
    [],
  );

  const handleObjectTap = useMemo(
    () =>
      createHandleObjectTap({
        gameObjectsRef,
        gameState,
        currentCategory,
        generateRandomTarget,
        spawnImmediateTargets,
        continuousMode,
        continuousModeTargetCount,
        continuousModeHighScore,
        continuousModeStartTime,
        setContinuousModeHighScore,
        setContinuousModeStartTime,
        refillTargetPool,
        setGameState,
        setScreenShake,
        setGameObjects,
      }),
    [
      gameState,
      currentCategory,
      generateRandomTarget,
      spawnImmediateTargets,
      continuousMode,
      continuousModeHighScore,
      continuousModeStartTime,
      refillTargetPool,
    ],
  );

  const handleWormTap = useMemo(
    () =>
      createHandleWormTap({
        setWorms,
        setFairyTransforms,
        wormSpeedMultiplier,
      }),
    [],
  );

  const { startGame, resetGame } = useMemo(
    () =>
      createGameSessionHandlers({
        clampLevel,
        gameStateLevel: gameState.level,
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
      gameState.level,
      continuousMode,
      generateRandomTarget,
      spawnImmediateTargets,
    ],
  );

  useSpawnInterval(gameState.gameStarted, gameState.winner, spawnObject);
  useAnimationLoop(
    gameState.gameStarted,
    gameState.winner,
    updateObjects,
    setWorms,
    setGameObjects,
    viewportRef,
    wormSpeedMultiplier,
    gameObjectsRef,
    wormsRef,
  );
  useFairyCleanup(gameState.gameStarted, gameState.winner, setFairyTransforms);

  const changeTargetToVisibleEmoji = useMemo(
    () =>
      createChangeTargetToVisibleEmoji({
        gameObjectsRef,
        gameStateRef,
        currentCategory,
        setGameState,
        spawnImmediateTargets,
      }),
    [currentCategory, spawnImmediateTargets],
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
