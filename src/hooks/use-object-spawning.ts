import { useCallback } from "react";
import { eventTracker } from "../lib/event-tracker";
import { calculateSafeSpawnPosition } from "../lib/utils/spawn-position";
import type { GameObject, GameState, PlayerSide } from "../types/game";
import {
  clamp,
  COLLISION_MIN_SEPARATION,
  EMOJI_SIZE,
  LANE_BOUNDS,
  MAX_ACTIVE_OBJECTS,
  MIN_DECOY_SLOTS,
  ROTATION_THRESHOLD,
  SPAWN_COUNT,
  SPAWN_VERTICAL_GAP,
  TARGET_GUARANTEE_COUNT,
} from "../lib/constants/game-config";

/**
 * Hook for managing object spawning logic
 * Extracted from use-game-logic.ts to reduce file size and improve maintainability
 */
export const useObjectSpawning = (
  gameStateRef: React.MutableRefObject<GameState>,
) => {
  // Track last appearance time for each emoji to ensure all appear within 10 seconds
  const lastEmojiAppearance = useRef<Map<string, number>>(new Map());
  const lastTargetSpawnTime = useRef(Date.now());

  // Cache stale emojis to avoid recalculating every spawn (performance optimization)
  const staleEmojisCache = useRef<{
    emojis: Array<{ emoji: string; name: string }>;
    timestamp: number;
  }>({
    emojis: [],
    timestamp: 0,
  });

  // Target pool system: ensures all targets are requested before any repeats
  // Shuffled array of remaining targets for current level
  const targetPool = useRef<Array<{ emoji: string; name: string }>>([]);

  // Fisher-Yates shuffle algorithm for randomizing target pool
  const shuffleArray = useCallback(<T>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, []);

  // Refill target pool with shuffled items from current category
  const refillTargetPool = useCallback(
    (levelIndex?: number) => {
      // This will need to be passed in or accessed differently
      // For now, placeholder - will be refactored in full implementation
      const category = { items: [] }; // TODO: Pass category as parameter
      targetPool.current = shuffleArray(category.items);

      if (import.meta.env.DEV) {
        console.log(
          `[TargetPool] Refilled with ${targetPool.current.length} items (shuffled)`,
        );
      }
    },
    [shuffleArray],
  );

  // Generate random target from current category
  const generateRandomTarget = useCallback((levelIndex?: number) => {
    // TODO: Implement full logic from use-game-logic.ts
    // Placeholder for now
    return { name: "apple", emoji: "🍎" };
  }, []);

  // Spawn immediate targets (2 guaranteed target emojis)
  const spawnImmediateTargets = useCallback(() => {
    // TODO: Implement full spawnImmediateTargets logic
    // Extracted from use-game-logic.ts lines 373-482
    console.log("spawnImmediateTargets called");
  }, []);

  // Main spawn object function
  const spawnObject = useCallback(() => {
    // TODO: Implement full spawnObject logic
    // Extracted from use-game-logic.ts lines 484-809
    console.log("spawnObject called");
  }, []);

  // Process lane collision detection
  const processLane = useCallback(
    (laneObjects: GameObject[], lane: PlayerSide) => {
      // TODO: Implement processLane logic
      // Extracted from use-game-logic.ts lines 811-863
    },
    [],
  );

  // Update object positions and handle collisions
  const updateObjects = useCallback(() => {
    // TODO: Implement updateObjects logic
    // Extracted from use-game-logic.ts lines 865-948
  }, [processLane]);

  return {
    spawnImmediateTargets,
    spawnObject,
    updateObjects,
    generateRandomTarget,
    refillTargetPool,
    lastEmojiAppearance,
    lastTargetSpawnTime,
    staleEmojisCache,
    targetPool,
  };
};
