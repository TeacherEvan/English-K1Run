import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GAME_CATEGORIES } from "../lib/constants/game-categories";
import type {
  Achievement,
  ComboCelebration,
  FairyTransformObject,
  GameObject,
  GameState,
  MilestoneEvent,
  UseGameLogicOptions,
  WormObject,
} from "../types/game";
import {
  useAnimationLoop,
  useCollisionLoop,
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

// Re-export for backward compatibility
export { GAME_CATEGORIES } from "../lib/constants/game-categories";
export type {
  Achievement,
  ComboCelebration,
  FairyTransformObject,
  GameCategory,
  GameObject,
  GameState,
  MilestoneEvent,
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
    targetChangeTime: Date.now() + 10000,
    streak: 0,
    multiplier: 1.0,
    lastMilestone: 0,
  }));
  const [comboCelebration, setComboCelebration] =
    useState<ComboCelebration | null>(null);
  const [currentMilestone, setCurrentMilestone] =
    useState<MilestoneEvent | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);

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
  const [showHighScoreWindow, setShowHighScoreWindow] = useState(false);
  const [lastCompletionTime, setLastCompletionTime] = useState<number | null>(
    null,
  );

  const viewportRef = useRef({ width: 1920, height: 1080 });
  useViewportObserver(viewportRef);

  const lastEmojiAppearance = useRef<Map<string, number>>(new Map());
  const lastTargetSpawnTime = useRef(Date.now());
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

  useTargetAnnouncement(gameState.gameStarted, gameState.currentTarget);
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
        setLastCompletionTime,
        setShowHighScoreWindow,
        setContinuousModeStartTime,
        refillTargetPool,
        setGameState,
        setAchievements,
        setComboCelebration,
        setScreenShake,
        setGameObjects,
        setCurrentMilestone,
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
        setAchievements,
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
        setComboCelebration,
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
    viewportRef,
    wormSpeedMultiplier,
  );
  useCollisionLoop(
    gameState.gameStarted,
    gameState.winner,
    wormsRef,
    gameObjectsRef,
    setGameObjects,
    viewportRef,
  );
  useFairyCleanup(gameState.gameStarted, gameState.winner, setFairyTransforms);

  const clearComboCelebration = useCallback(
    () => setComboCelebration(null),
    [],
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
    [currentCategory, spawnImmediateTargets],
  );

  const clearMilestone = useCallback(() => {
    setCurrentMilestone(null);
  }, []);

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
    comboCelebration,
    clearComboCelebration,
    changeTargetToVisibleEmoji,
    achievements,
    clearAchievement: (achievementId: number) => {
      setAchievements((prev) => prev.filter((a) => a.id !== achievementId));
    },
    continuousModeElapsed: continuousModeStartTime
      ? Date.now() - continuousModeStartTime
      : null,
    continuousModeHighScore,
    showHighScoreWindow,
    lastCompletionTime,
    closeHighScoreWindow: () => setShowHighScoreWindow(false),
    currentMilestone,
    clearMilestone,
    currentMultiplier: gameState.multiplier || 1.0,
  };
};
