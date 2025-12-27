import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { eventTracker } from "../lib/event-tracker";
import { playSoundEffect } from "../lib/sound-manager";
import { multiTouchHandler } from "../lib/touch-handler";
import { calculateSafeSpawnPosition } from "../lib/utils/spawn-position";
// Types
import type {
  Achievement,
  ComboCelebration,
  FairyTransformObject,
  GameObject,
  GameState,
  PlayerSide,
  UseGameLogicOptions,
  WormObject,
} from "../types/game";
// Constants
import { COMBO_LEVELS } from "../lib/constants/combo-levels";
import {
  clamp,
  COLLISION_MIN_SEPARATION,
  EMOJI_SIZE,
  FAIRY_TRANSFORM_DURATION,
  LANE_BOUNDS,
  MAX_ACTIVE_OBJECTS,
  MIN_DECOY_SLOTS,
  MIN_VERTICAL_GAP,
  ROTATION_THRESHOLD,
  SPAWN_COUNT,
  SPAWN_VERTICAL_GAP,
  TARGET_GUARANTEE_COUNT,
  WORM_BASE_SPEED,
  WORM_INITIAL_COUNT,
  WORM_PROGRESSIVE_SPAWN_INTERVAL,
  WORM_RECURRING_COUNT,
  WORM_RECURRING_INTERVAL,
  WORM_SIZE,
} from "../lib/constants/game-config";
import { CORRECT_MESSAGES } from "../lib/constants/messages";

// Re-export for backward compatibility
export { GAME_CATEGORIES } from "../lib/constants/game-categories";
export type {
  Achievement,
  ComboCelebration,
  FairyTransformObject,
  GameCategory,
  GameObject,
  GameState,
  PlayerSide,
  WormObject,
} from "../types/game";

// Import GAME_CATEGORIES for internal use
import { GAME_CATEGORIES } from "../lib/constants/game-categories";

/**
 * Core game logic hook for Kindergarten Race Game
 *
 * Manages all gameplay state including:
 * - Falling objects and worms with physics/collision detection
 * - Target selection and progress tracking
 * - Audio feedback and visual effects
 * - Multi-touch input handling
 * - Performance optimization with 60fps target
 *
 * @param options - Configuration options
 * @param options.fallSpeedMultiplier - Multiplier for fall speed (default: 1.0)
 * @returns Game state and control functions
 *
 * @example
 * ```typescript
 * const {
 *   gameObjects,
 *   gameState,
 *   startGame,
 *   handleObjectTap
 * } = useGameLogic({ fallSpeedMultiplier: 1.2 })
 * ```
 */
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
  }));
  const [comboCelebration, setComboCelebration] =
    useState<ComboCelebration | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  // Track target count in continuous mode for level cycling
  const continuousModeTargetCount = useRef(0);

  // Continuous mode timer and high score
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
    null
  );

  // Cache viewport size to avoid reading window dimensions every frame.
  const viewportRef = useRef({ width: 1920, height: 1080 });
  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateViewport = () => {
      viewportRef.current.width = window.innerWidth;
      viewportRef.current.height = window.innerHeight;
    };

    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  // Track last appearance time for each emoji to ensure all appear within 10 seconds
  const lastEmojiAppearance = useRef<Map<string, number>>(new Map());
  const lastTargetSpawnTime = useRef(Date.now());

  // Target pool system: ensures all targets are requested before any repeats
  // Shuffled array of remaining targets for current level
  const targetPool = useRef<Array<{ emoji: string; name: string }>>([]);

  // Cache stale emojis to avoid recalculating every spawn (performance optimization)
  const staleEmojisCache = useRef<{
    emojis: Array<{ emoji: string; name: string }>;
    timestamp: number;
  }>({
    emojis: [],
    timestamp: 0,
  });

  // Background rotation is handled in App.tsx, not here

  // Use ref to access current game state in callbacks without causing re-creation
  const gameStateRef = useRef(gameState);
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // Keep a ref to gameObjects to avoid stale closures inside callbacks (e.g. taps)
  const gameObjectsRef = useRef<GameObject[]>(gameObjects);
  useEffect(() => {
    gameObjectsRef.current = gameObjects;
  }, [gameObjects]);

  // Keep a ref to worms for collision detection
  const wormsRef = useRef<WormObject[]>(worms);
  useEffect(() => {
    wormsRef.current = worms;
  }, [worms]);

  // Animation frame ref for worm movement

  const wormSpeedMultiplier = useRef(1);

  // Helper function to check and apply worm-object collision
  const applyWormObjectCollision = useCallback(
    (worms: WormObject[], objects: GameObject[]) => {
      // Skip if no worms or objects
      if (worms.length === 0 || objects.length === 0) return;

      const viewportWidth = viewportRef.current.width;

      // Collision radius in pixels
      const wormRadiusPx = WORM_SIZE / 2;
      const objectRadiusPx = EMOJI_SIZE / 2;
      const collisionDistancePx = wormRadiusPx + objectRadiusPx;

      // Check each worm against each object
      for (const worm of worms) {
        if (!worm.alive) continue;

        // Convert worm X from percentage to pixels for distance calculation
        const wormXPx = (worm.x / 100) * viewportWidth;
        const wormYPx = worm.y;

        for (const obj of objects) {
          // Convert object X from percentage to pixels
          const objXPx = (obj.x / 100) * viewportWidth;
          const objYPx = obj.y;

          // Calculate distance between worm and object centers
          const dx = objXPx - wormXPx;
          const dy = objYPx - wormYPx;
          const distance = Math.sqrt(dx * dx + dy * dy);

          // Check if collision occurred
          if (distance < collisionDistancePx && distance > 0) {
            // Calculate bump force (push object away from worm)
            const overlap = collisionDistancePx - distance;
            const pushStrength = overlap * 0.3; // Moderate push strength

            // Normalize direction vector
            const dirX = dx / distance;
            const dirY = dy / distance;

            // Apply push to object (convert back to percentage for X)
            const pushXPx = dirX * pushStrength;
            const pushYPx = dirY * pushStrength;

            obj.x += (pushXPx / viewportWidth) * 100; // Convert pixels to percentage
            obj.y += pushYPx;

            // Clamp object position to screen bounds
            const [minX, maxX] = LANE_BOUNDS[obj.lane];
            obj.x = clamp(obj.x, minX, maxX);
            obj.y = Math.max(0, obj.y); // Don't push above screen
          }
        }
      }
    },
    []
  );

  // Refs for worm spawning timers
  const progressiveSpawnTimeoutRefs = useRef<NodeJS.Timeout[]>([]);
  const recurringSpawnIntervalRef = useRef<NodeJS.Timeout | undefined>(
    undefined
  );

  // Helper function to create worms
  const createWorms = useCallback(
    (count: number, startIndex: number = 0): WormObject[] => {
      return Array.from({ length: count }, (_, i) => {
        const actualIndex = startIndex + i;
        const lane: PlayerSide = actualIndex % 2 === 0 ? "left" : "right";
        const [minX, maxX] = LANE_BOUNDS[lane];
        return {
          id: `worm-${Date.now()}-${actualIndex}`,
          x: Math.random() * (maxX - minX) + minX,
          y: Math.random() * 300 + 100, // Start in visible area (100-400px)
          vx: (Math.random() - 0.5) * WORM_BASE_SPEED * 2,
          vy: (Math.random() - 0.5) * WORM_BASE_SPEED * 2,
          alive: true,
          angle: Math.random() * Math.PI * 2,
          wigglePhase: Math.random() * Math.PI * 2,
          lane,
        };
      });
    },
    []
  );

  const clampLevel = useCallback((levelIndex: number) => {
    if (Number.isNaN(levelIndex)) return 0;
    return Math.max(0, Math.min(levelIndex, GAME_CATEGORIES.length - 1));
  }, []);

  // Memoize current category to avoid recalculation on every render
  const currentCategory = useMemo(
    () => GAME_CATEGORIES[gameState.level] || GAME_CATEGORIES[0],
    [gameState.level]
  );

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
      const level = levelIndex !== undefined ? levelIndex : gameState.level;
      const category = GAME_CATEGORIES[level] || GAME_CATEGORIES[0];
      targetPool.current = shuffleArray(category.items);

      if (import.meta.env.DEV) {
        console.log(
          `[TargetPool] Refilled with ${targetPool.current.length} items (shuffled)`
        );
      }
    },
    [gameState.level, shuffleArray]
  );

  useEffect(() => {
    if (gameState.gameStarted && gameState.currentTarget) {
      // Announce target with full sentence template for richer instruction
      void playSoundEffect.voice(gameState.currentTarget);
    }
  }, [gameState.gameStarted, gameState.currentTarget]);

  const generateRandomTarget = useCallback(
    (levelOverride?: number) => {
      const levelIndex = clampLevel(levelOverride ?? gameState.level);
      const category = GAME_CATEGORIES[levelIndex] || GAME_CATEGORIES[0];

      // Sequence mode (Alphabet Challenge) - use sequential order
      if (category.requiresSequence) {
        const sequenceIndex = category.sequenceIndex || 0;
        const targetItem =
          category.items[sequenceIndex % category.items.length];
        return { name: targetItem.name, emoji: targetItem.emoji };
      }

      // Non-sequence mode - use target pool to ensure no repeats until all targets used
      // If pool is empty, refill it with shuffled items
      if (targetPool.current.length === 0) {
        refillTargetPool(levelIndex);
      }

      // Pop the next target from the pool
      const targetItem = targetPool.current.pop()!;

      if (import.meta.env.DEV) {
        console.log(
          `[TargetPool] Selected "${targetItem.name}", ${targetPool.current.length} remaining`
        );
      }

      return { name: targetItem.name, emoji: targetItem.emoji };
    },
    [clampLevel, gameState.level, refillTargetPool]
  );
  // Target initialization is handled in startGame function

  // Spawn objects while respecting lane separation and the active object cap
  // Spawn 2 target emojis immediately when target changes
  const spawnImmediateTargets = useCallback(() => {
    try {
      setGameObjects((prev) => {
        if (prev.length >= MAX_ACTIVE_OBJECTS - 2) {
          // Ensure we have room for at least 2 targets
          return prev;
        }

        const level =
          GAME_CATEGORIES[gameStateRef.current.level] || GAME_CATEGORIES[0];
        const currentTarget = gameStateRef.current.targetEmoji;
        const targetItem = level.items.find(
          (item) => item.emoji === currentTarget
        );

        if (!targetItem) {
          return prev;
        }

        const created: GameObject[] = [];
        const now = Date.now();

        // Pre-partition objects by lane (performance optimization)
        const leftLaneObjects: GameObject[] = [];
        const rightLaneObjects: GameObject[] = [];
        for (const obj of prev) {
          if (obj.lane === "left") {
            leftLaneObjects.push(obj);
          } else {
            rightLaneObjects.push(obj);
          }
        }
        const createdLeftLane: GameObject[] = [];
        const createdRightLane: GameObject[] = [];

        // Spawn exactly 2 target emojis - one on each side for fairness
        for (let i = 0; i < 2; i++) {
          const lane: PlayerSide = i === 0 ? "left" : "right";
          const [minX, maxX] = LANE_BOUNDS[lane];

          // Update emoji appearance tracking
          lastEmojiAppearance.current.set(targetItem.emoji, now);

          // Track emoji appearance in event tracker
          eventTracker.trackEmojiAppearance(targetItem.emoji, targetItem.name);

          const initialX = Math.random() * (maxX - minX) + minX;
          const initialY = 0 - i * SPAWN_VERTICAL_GAP;

          // Use pre-partitioned objects instead of filtering (performance optimization)
          const baseLaneObjects =
            lane === "left" ? leftLaneObjects : rightLaneObjects;
          const createdLaneObjects =
            lane === "left" ? createdLeftLane : createdRightLane;
          const laneObjects = [...baseLaneObjects, ...createdLaneObjects];

          // Use utility function for safe spawn position
          const { x: spawnX, y: spawnY } = calculateSafeSpawnPosition({
            initialX,
            initialY,
            existingObjects: laneObjects,
            laneConstraints: { minX, maxX },
          });

          const newObject: GameObject = {
            id: `immediate-target-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}`,
            type: targetItem.name,
            emoji: targetItem.emoji,
            x: spawnX,
            y: spawnY,
            speed: (Math.random() * 0.8 + 0.6) * fallSpeedMultiplier,
            size: EMOJI_SIZE,
            lane,
          };

          eventTracker.trackEmojiLifecycle({
            objectId: newObject.id,
            emoji: newObject.emoji,
            name: newObject.type,
            phase: "spawned",
            position: { x: newObject.x, y: newObject.y },
            playerSide: newObject.lane,
          });

          // Track in lane-specific arrays
          if (lane === "left") {
            createdLeftLane.push(newObject);
          } else {
            createdRightLane.push(newObject);
          }
          created.push(newObject);
        }

        if (created.length > 0) {
          eventTracker.trackObjectSpawn(`immediate-targets-${created.length}`, {
            count: created.length,
          });
          return [...prev, ...created];
        }

        return prev;
      });
    } catch (error) {
      eventTracker.trackError(error as Error, "spawnImmediateTargets");
    }
  }, [fallSpeedMultiplier]);

  const spawnObject = useCallback(() => {
    try {
      setGameObjects((prev) => {
        const now = Date.now();
        const timeSinceLastTarget = now - lastTargetSpawnTime.current;
        // Force target spawn if it's been more than 6 seconds (safety margin under 8s requirement)
        const forceTargetSpawn = timeSinceLastTarget > 6000;

        const level =
          GAME_CATEGORIES[gameStateRef.current.level] || GAME_CATEGORIES[0];
        const currentTarget = gameStateRef.current.targetEmoji;

        // Reserve slots so there is always room for decoys alongside guaranteed targets
        const requiredSlots = TARGET_GUARANTEE_COUNT + MIN_DECOY_SLOTS;
        const maxObjectsBeforeSpawn = MAX_ACTIVE_OBJECTS - requiredSlots;

        let workingList = [...prev];
        if (workingList.length > maxObjectsBeforeSpawn) {
          const targetEmoji = currentTarget;
          let targetCountOnScreen = 0;
          const idsToRemove = new Set<string>();
          let removedCount = 0;

          // Get screen height for off-screen detection
          const screenHeight =
            typeof window !== "undefined" ? window.innerHeight : 1080;
          const offScreenThreshold = screenHeight * 0.8; // Only remove objects that are 80% down the screen

          // Single pass: count targets and identify removal candidates (optimized)
          const candidates: Array<{
            id: string;
            y: number;
            isTarget: boolean;
          }> = [];
          for (const obj of workingList) {
            const isTarget = !!(targetEmoji && obj.emoji === targetEmoji);
            if (isTarget) targetCountOnScreen++;
            // Only consider objects that are far down the screen for removal
            if (obj.y >= offScreenThreshold) {
              candidates.push({ id: obj.id, y: obj.y, isTarget });
            }
          }

          // Sort by Y descending (furthest down = highest priority for removal)
          candidates.sort((a, b) => b.y - a.y);

          // Mark objects for removal
          for (const candidate of candidates) {
            if (workingList.length - removedCount <= maxObjectsBeforeSpawn) {
              break;
            }

            // Never drop below the guaranteed target floor
            if (
              candidate.isTarget &&
              targetCountOnScreen <= TARGET_GUARANTEE_COUNT
            ) {
              continue;
            }

            idsToRemove.add(candidate.id);
            if (candidate.isTarget) {
              targetCountOnScreen--;
            }
            removedCount++;
          }

          // Single filter pass to remove marked objects
          if (removedCount > 0) {
            workingList = workingList.filter((obj) => !idsToRemove.has(obj.id));
            if (import.meta.env.DEV) {
              console.log(
                `[SpawnObject] Trimmed ${removedCount} old objects to reserve decoy slots`
              );
            }
          }
        }

        const availableSlots = Math.max(
          0,
          MAX_ACTIVE_OBJECTS - workingList.length
        );

        // If forcing target spawn, ensure we have at least 1 slot
        let actualSpawnCount = Math.min(availableSlots, SPAWN_COUNT);
        if (forceTargetSpawn && actualSpawnCount <= 0) {
          actualSpawnCount = 1;
        }

        const created: GameObject[] = [];

        if (actualSpawnCount <= 0) {
          return prev;
        }

        // Track emojis spawned in this batch to prevent duplicates
        const spawnedInBatch = new Set<string>();
        // Track recently active emojis on screen to reduce duplicates (optimized)
        const activeEmojis = new Set<string>();
        for (const obj of workingList) {
          activeEmojis.add(obj.emoji);
        }

        // Pre-partition objects by lane to avoid repeated filtering (performance optimization)
        const leftLaneObjects: GameObject[] = [];
        const rightLaneObjects: GameObject[] = [];
        for (const obj of workingList) {
          if (obj.lane === "left") {
            leftLaneObjects.push(obj);
          } else {
            rightLaneObjects.push(obj);
          }
        }
        const createdLeftLane: GameObject[] = [];
        const createdRightLane: GameObject[] = [];

        // Get stale emojis (cached for 5 seconds to avoid recalculating every spawn)
        // now is already defined at the top of the function
        let staleEmojis: Array<{ emoji: string; name: string }>;

        if (now - staleEmojisCache.current.timestamp > 5000) {
          // Recalculate stale emojis (haven't appeared in 10 seconds)
          staleEmojis = level.items.filter((item) => {
            const lastSeen = lastEmojiAppearance.current.get(item.emoji);
            return !lastSeen || now - lastSeen > ROTATION_THRESHOLD;
          });
          staleEmojisCache.current = { emojis: staleEmojis, timestamp: now };
        } else {
          // Use cached value
          staleEmojis = staleEmojisCache.current.emojis;
        }

        // Helper function to select item (prevents duplicate code)
        const selectItem = () => {
          if (staleEmojis.length > 0 && Math.random() < 0.7) {
            return staleEmojis[Math.floor(Math.random() * staleEmojis.length)];
          }
          return level.items[Math.floor(Math.random() * level.items.length)];
        };

        // CRITICAL: First, spawn TARGET_GUARANTEE_COUNT instances of the current target
        // This ensures the requested emoji is ALWAYS visible on screen
        const targetItem = level.items.find(
          (item) => item.emoji === currentTarget
        );
        let targetSpawnCount = 0;

        if (targetItem) {
          // If forcing target spawn, ensure we spawn at least 1 target
          const targetCountToSpawn = forceTargetSpawn
            ? Math.max(1, Math.min(TARGET_GUARANTEE_COUNT, actualSpawnCount))
            : Math.min(TARGET_GUARANTEE_COUNT, actualSpawnCount);

          for (let i = 0; i < targetCountToSpawn; i++) {
            const { minX, maxX, lane } = (() => {
              const chosenLane: PlayerSide =
                Math.random() < 0.5 ? "left" : "right";
              const [laneMin, laneMax] = LANE_BOUNDS[chosenLane];
              return { minX: laneMin, maxX: laneMax, lane: chosenLane };
            })();

            const item = targetItem;
            spawnedInBatch.add(item.emoji);
            lastEmojiAppearance.current.set(item.emoji, now);
            lastTargetSpawnTime.current = now; // Update timestamp
            targetSpawnCount++;

            // Track emoji appearance in event tracker
            eventTracker.trackEmojiAppearance(item.emoji, item.name);

            const initialX = Math.random() * (maxX - minX) + minX;
            const initialY = 0 - i * SPAWN_VERTICAL_GAP;

            // Use pre-partitioned lane objects instead of filtering (performance optimization)
            const baseLaneObjects =
              lane === "left" ? leftLaneObjects : rightLaneObjects;
            const createdLaneObjects =
              lane === "left" ? createdLeftLane : createdRightLane;
            const laneObjects = [...baseLaneObjects, ...createdLaneObjects];

            // Use utility function for safe spawn position
            const { x: spawnX, y: spawnY } = calculateSafeSpawnPosition({
              initialX,
              initialY,
              existingObjects: laneObjects,
              laneConstraints: { minX, maxX },
            });

            const newObject: GameObject = {
              id: `target-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}`,
              type: item.name,
              emoji: item.emoji,
              x: spawnX,
              y: spawnY,
              speed: (Math.random() * 0.8 + 0.6) * fallSpeedMultiplier,
              size: EMOJI_SIZE,
              lane,
            };

            eventTracker.trackEmojiLifecycle({
              objectId: newObject.id,
              emoji: newObject.emoji,
              name: newObject.type,
              phase: "spawned",
              position: { x: newObject.x, y: newObject.y },
              playerSide: newObject.lane,
            });

            // Track in lane-specific arrays
            if (lane === "left") {
              createdLeftLane.push(newObject);
            } else {
              createdRightLane.push(newObject);
            }
            created.push(newObject);
          }
        }

        // Now spawn the remaining objects (actualSpawnCount - targetSpawnCount)
        for (let i = targetSpawnCount; i < actualSpawnCount; i++) {
          const { minX, maxX, lane } = (() => {
            const chosenLane: PlayerSide =
              Math.random() < 0.5 ? "left" : "right";
            const [laneMin, laneMax] = LANE_BOUNDS[chosenLane];
            return { minX: laneMin, maxX: laneMax, lane: chosenLane };
          })();

          // Select item using helper function (prioritizes stale emojis)
          let item = selectItem();

          // Try to avoid duplicates in current batch and on screen (performance optimization)
          // Pre-check to avoid entering loop if item is acceptable
          const isDuplicateInBatch = spawnedInBatch.has(item.emoji);
          const isDuplicateActive = activeEmojis.has(item.emoji);

          if (
            isDuplicateInBatch ||
            (isDuplicateActive && Math.random() > 0.3)
          ) {
            let attempts = 0;
            const maxAttempts = level.items.length * 2;

            // Simplified loop - only re-select if needed
            while (attempts < maxAttempts) {
              item = selectItem();
              attempts++;

              // Check if this item is acceptable
              if (
                !spawnedInBatch.has(item.emoji) &&
                (!activeEmojis.has(item.emoji) || Math.random() <= 0.3)
              ) {
                break;
              }
            }
          }

          // Mark this emoji as spawned in current batch and update last appearance time
          spawnedInBatch.add(item.emoji);
          lastEmojiAppearance.current.set(item.emoji, now);

          // Track emoji appearance in event tracker
          eventTracker.trackEmojiAppearance(item.emoji, item.name);

          const initialX = Math.random() * (maxX - minX) + minX;
          const initialY = 0 - i * SPAWN_VERTICAL_GAP;

          // Use pre-partitioned lane objects instead of filtering (performance optimization)
          const baseLaneObjects =
            lane === "left" ? leftLaneObjects : rightLaneObjects;
          const createdLaneObjects =
            lane === "left" ? createdLeftLane : createdRightLane;
          const laneObjects = [...baseLaneObjects, ...createdLaneObjects];

          // Use utility function for safe spawn position
          const { x: spawnX, y: spawnY } = calculateSafeSpawnPosition({
            initialX,
            initialY,
            existingObjects: laneObjects,
            laneConstraints: { minX, maxX },
          });

          const newObject: GameObject = {
            id: `${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}`,
            type: item.name,
            emoji: item.emoji,
            x: spawnX,
            y: spawnY,
            speed: (Math.random() * 0.8 + 0.6) * fallSpeedMultiplier,
            size: EMOJI_SIZE,
            lane,
          };

          eventTracker.trackEmojiLifecycle({
            objectId: newObject.id,
            emoji: newObject.emoji,
            name: newObject.type,
            phase: "spawned",
            position: { x: newObject.x, y: newObject.y },
            playerSide: newObject.lane,
          });

          // Track in lane-specific arrays
          if (lane === "left") {
            createdLeftLane.push(newObject);
          } else {
            createdRightLane.push(newObject);
          }
          created.push(newObject);
        }

        if (created.length > 0) {
          eventTracker.trackObjectSpawn(`batch-${created.length}`, {
            count: created.length,
          });
          return [...workingList, ...created];
        }

        return workingList;
      });
    } catch (error) {
      eventTracker.trackError(error as Error, "spawnObject");
    }
  }, [fallSpeedMultiplier]);

  const processLane = useCallback(
    (laneObjects: GameObject[], lane: PlayerSide) => {
      const laneLength = laneObjects.length;

      // Early exit if no objects to process
      if (laneLength === 0) return;

      // Cache lane bounds lookup (performance optimization)
      const [minX, maxX] = LANE_BOUNDS[lane];
      const minSep = COLLISION_MIN_SEPARATION;
      const minVertGap = MIN_VERTICAL_GAP;

      // Sort objects by Y position once for better spatial coherence
      // This allows us to break early when objects are too far apart vertically
      const sorted = laneObjects.slice().sort((a, b) => a.y - b.y);

      for (let i = 0; i < laneLength; i++) {
        const current = sorted[i];

        // Skip collision detection for objects still spawning (y < 0)
        // This prevents the 8 newly spawned emojis from pushing each other around
        if (current.y < 0) continue;

        // Clamp once before collision checks
        current.x = clamp(current.x, minX, maxX);

        // Only check objects below current (spatial coherence optimization)
        for (let j = i + 1; j < laneLength; j++) {
          const other = sorted[j];

          // Skip collision with objects still spawning (y < 0)
          if (other.y < 0) continue;

          // Early exit: since sorted by Y, if vertical gap too large, all remaining objects are also too far
          const verticalGap = other.y - current.y; // Always positive since sorted
          if (verticalGap > minVertGap) break; // No need to check remaining objects

          const horizontalGap = Math.abs(current.x - other.x);

          // Early exit: objects far enough apart horizontally or exactly overlapping
          if (horizontalGap >= minSep || horizontalGap === 0) continue;

          // Apply collision resolution
          const overlap = (minSep - horizontalGap) / 2;
          const direction = current.x < other.x ? -1 : 1;

          current.x = clamp(current.x + overlap * direction, minX, maxX);
          other.x = clamp(other.x - overlap * direction, minX, maxX);
        }
      }
    },
    []
  );

  const updateObjects = useCallback(() => {
    try {
      setGameObjects((prev) => {
        // Early exit if no objects to update
        if (prev.length === 0) return prev;

        const screenHeight = viewportRef.current.height;
        const speedMultiplier = 1.2;

        // Pre-allocate array to reduce reallocation overhead (performance optimization)
        const updated: GameObject[] = new Array(prev.length);
        let updatedIndex = 0;

        for (const obj of prev) {
          const newY = obj.y + obj.speed * speedMultiplier;

          if (newY < screenHeight + EMOJI_SIZE) {
            // Only update Y coordinate, reuse other properties (performance optimization)
            updated[updatedIndex++] = {
              id: obj.id,
              type: obj.type,
              emoji: obj.emoji,
              x: obj.x,
              y: newY, // Only this changed
              speed: obj.speed,
              size: obj.size,
              lane: obj.lane,
            };
          } else {
            eventTracker.trackEmojiLifecycle({
              objectId: obj.id,
              emoji: obj.emoji,
              name: obj.type,
              phase: "missed",
              position: {
                x: obj.x,
                y: Math.min(obj.y, screenHeight + EMOJI_SIZE),
              },
              playerSide: obj.lane,
              data: {
                reason: "fell_off_screen",
                actualY: obj.y,
                calculatedY: newY,
                screenHeight,
              },
            });
          }
        }

        // Trim array to actual size if objects fell off screen
        if (updatedIndex < updated.length) {
          updated.length = updatedIndex;
        }

        // Only process collision detection if we have multiple objects
        if (updated.length > 1) {
          // Single-pass separation into lanes (performance optimization)
          const leftObjects: GameObject[] = [];
          const rightObjects: GameObject[] = [];

          for (const obj of updated) {
            if (obj.lane === "left") {
              leftObjects.push(obj);
            } else {
              rightObjects.push(obj);
            }
          }

          // Only process lanes that have objects
          if (leftObjects.length > 1) processLane(leftObjects, "left");
          if (rightObjects.length > 1) processLane(rightObjects, "right");
        }

        return updated;
      });
    } catch (error) {
      eventTracker.trackError(error as Error, "updateObjects");
    }
  }, [processLane]);

  const handleObjectTap = useCallback(
    (objectId: string, playerSide: "left" | "right") => {
      const tapStartTime = performance.now();

      try {
        // Use ref to avoid stale `gameObjects` value inside this callback
        const tappedObject = gameObjectsRef.current.find(
          (obj) => obj.id === objectId
        );
        if (!tappedObject) {
          eventTracker.trackWarning("Tapped object not found", {
            objectId,
            playerSide,
          });
          return;
        }

        const isCorrect = currentCategory.requiresSequence
          ? tappedObject.type === gameState.currentTarget
          : tappedObject.emoji === gameState.targetEmoji;

        const tapLatency = performance.now() - tapStartTime;
        eventTracker.trackObjectTap(
          objectId,
          isCorrect,
          tappedObject.lane,
          tapLatency
        );

        // Track emoji lifecycle - tapped phase
        eventTracker.trackEmojiLifecycle({
          objectId: tappedObject.id,
          emoji: tappedObject.emoji,
          name: tappedObject.type,
          phase: "tapped",
          position: { x: tappedObject.x, y: tappedObject.y },
          playerSide: tappedObject.lane,
          data: { isCorrect, tapLatency },
        });

        setGameState((prev) => {
          const newState = { ...prev };

          if (isCorrect) {
            // Correct tap: visual feedback only (no audio to avoid sentence repetition)

            // Create achievement popup at tap location
            const randomMsg =
              CORRECT_MESSAGES[
                Math.floor(Math.random() * CORRECT_MESSAGES.length)
              ];
            setAchievements((prevAchievements) => [
              ...prevAchievements,
              {
                id: Date.now(),
                type: "correct",
                message: randomMsg.message,
                emoji: randomMsg.emoji,
                x: tappedObject.x,
                y: tappedObject.y,
                playerSide: tappedObject.lane,
              },
            ]);

            const nextStreak = prev.streak + 1;
            newState.streak = nextStreak;

            const comboLevel = COMBO_LEVELS.find(
              (level) => level.streak === nextStreak
            );
            if (comboLevel) {
              const comboData: ComboCelebration = {
                id: Date.now(),
                streak: nextStreak,
                title: comboLevel.title,
                description: comboLevel.description,
              };
              setComboCelebration(comboData);
              eventTracker.trackEvent({
                type: "info",
                category: "combo",
                message: `Combo streak reached ${comboData.streak}`,
                data: { ...comboData },
              });
            }

            newState.progress = Math.min(prev.progress + 20, 100);

            // Check for winner or continuous mode
            if (newState.progress >= 100) {
              if (continuousMode) {
                // Continuous mode: increment target count and check for level change
                continuousModeTargetCount.current += 1;

                // Reset progress and continue playing
                newState.progress = 0;
                newState.winner = false;

                // Check if we should advance to next level (every 5 targets)
                if (continuousModeTargetCount.current >= 5) {
                  continuousModeTargetCount.current = 0; // Reset counter

                  // Advance to next level, loop back to 0 after last level
                  const nextLevel = (prev.level + 1) % GAME_CATEGORIES.length;
                  newState.level = nextLevel;

                  // Reset sequence index for new level if needed
                  if (GAME_CATEGORIES[nextLevel].requiresSequence) {
                    GAME_CATEGORIES[nextLevel].sequenceIndex = 0;
                  }

                  // Refill target pool for new level
                  refillTargetPool(nextLevel);

                  // Check if completing all levels (looping back to 0)
                  if (nextLevel === 0 && continuousModeStartTime) {
                    const elapsed = Date.now() - continuousModeStartTime;
                    setLastCompletionTime(elapsed);
                    if (
                      !continuousModeHighScore ||
                      elapsed < continuousModeHighScore
                    ) {
                      setContinuousModeHighScore(elapsed);
                      localStorage.setItem(
                        "continuousModeHighScore",
                        elapsed.toString()
                      );
                    }
                    setShowHighScoreWindow(true);
                    // Reset timer for next run
                    setContinuousModeStartTime(Date.now());
                  }

                  eventTracker.trackGameStateChange(
                    { ...prev },
                    { ...newState },
                    "continuous_mode_level_change"
                  );

                  if (import.meta.env.DEV) {
                    console.log(
                      `[ContinuousMode] Advanced to level ${nextLevel}: ${GAME_CATEGORIES[nextLevel].name}`
                    );
                  }
                } else {
                  eventTracker.trackGameStateChange(
                    { ...prev },
                    { ...newState },
                    "continuous_mode_reset"
                  );
                }

                // Generate next target for the (possibly new) level
                const nextTarget = generateRandomTarget(newState.level);
                newState.currentTarget = nextTarget.name;
                newState.targetEmoji = nextTarget.emoji;
                newState.targetChangeTime = Date.now() + 10000;

                // Spawn immediate targets for continuous play
                setTimeout(() => spawnImmediateTargets(), 0);
              } else {
                // Normal mode: declare winner
                newState.winner = true;
                eventTracker.trackGameStateChange(
                  { ...prev },
                  { ...newState },
                  "player_wins"
                );
              }
            }

            // Change target immediately on correct tap (for non-sequence modes)
            if (!currentCategory.requiresSequence && !newState.winner) {
              const nextTarget = generateRandomTarget();
              newState.currentTarget = nextTarget.name;
              newState.targetEmoji = nextTarget.emoji;
              newState.targetChangeTime = Date.now() + 10000; // Reset timer
              eventTracker.trackGameStateChange(
                { ...prev },
                { ...newState },
                "target_change_on_correct_tap"
              );

              // Spawn 2 immediate target emojis for the new target
              setTimeout(() => spawnImmediateTargets(), 0);
            }

            // Advance sequence for alphabet level
            if (currentCategory.requiresSequence) {
              const nextIndex = (currentCategory.sequenceIndex || 0) + 1;
              GAME_CATEGORIES[prev.level].sequenceIndex = nextIndex;

              if (nextIndex < currentCategory.items.length) {
                const nextTarget = generateRandomTarget();
                newState.currentTarget = nextTarget.name;
                newState.targetEmoji = nextTarget.emoji;
                eventTracker.trackGameStateChange(
                  { ...prev },
                  { ...newState },
                  "sequence_advance"
                );

                // Spawn 2 immediate target emojis for the new sequence target
                setTimeout(() => spawnImmediateTargets(), 0);
              }
            }
          } else {
            // Incorrect tap: no sound feedback - penalty applied
            newState.streak = 0;
            newState.progress = Math.max(prev.progress - 20, 0);
            eventTracker.trackGameStateChange(
              { ...prev },
              { ...newState },
              "incorrect_tap_penalty"
            );

            // Trigger screen shake for incorrect tap
            setScreenShake(true);
            setTimeout(() => setScreenShake(false), 500); // Reset after animation completes
          }

          return newState;
        });

        // Remove the tapped object regardless of correct/incorrect
        setGameObjects((prev) => {
          // Track removal before filtering
          const removedObj = prev.find((obj) => obj.id === objectId);
          if (removedObj) {
            eventTracker.trackEmojiLifecycle({
              objectId: removedObj.id,
              emoji: removedObj.emoji,
              name: removedObj.type,
              phase: "removed",
              position: { x: removedObj.x, y: removedObj.y },
              playerSide: tappedObject.lane,
              data: { reason: "tapped", isCorrect },
            });
          }
          return prev.filter((obj) => obj.id !== objectId);
        });
      } catch (error) {
        eventTracker.trackError(error as Error, "handleObjectTap");
      }
    },
    [
      gameState.currentTarget,
      gameState.targetEmoji,
      currentCategory,
      generateRandomTarget,
      spawnImmediateTargets,
      continuousMode,
      refillTargetPool,
    ]
  );

  const handleWormTap = useCallback(
    (wormId: string, playerSide: "left" | "right") => {
      try {
        setWorms((prev) => {
          const worm = prev.find((w) => w.id === wormId);
          if (!worm || !worm.alive) return prev;

          // Create coin achievement popup for worm tap (no message, just coin animation)
          setAchievements((prevAchievements) => [
            ...prevAchievements,
            {
              id: Date.now(),
              type: "worm",
              message: "", // No message displayed - coin animation will show instead
              emoji: undefined,
              x: worm.x,
              y: worm.y,
              playerSide: worm.lane,
            },
          ]);

          // Create fairy transformation effect at worm position (child-friendly rescue animation)
          if (import.meta.env.DEV) {
            console.log(
              `[FairySpawn] Creating fairy at worm position: x=${worm.x}%, y=${worm.y}px, lane=${worm.lane}`
            );
          }
          setFairyTransforms((prevFairies) => [
            ...prevFairies,
            {
              id: `fairy-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              x: worm.x,
              y: worm.y,
              createdAt: Date.now(),
              lane: worm.lane,
            },
          ]);

          // Mark worm as dead
          const updatedWorms = prev.map((w) =>
            w.id === wormId ? { ...w, alive: false } : w
          );

          // Increase speed for remaining worms (20% increase per kill)
          const aliveCount = updatedWorms.filter((w) => w.alive).length;
          if (aliveCount > 0) {
            wormSpeedMultiplier.current *= 1.2;
          }

          eventTracker.trackEvent({
            type: "info",
            category: "worm",
            message: `Worm killed, ${aliveCount} remaining`,
            data: { wormId, playerSide, aliveCount },
          });

          return updatedWorms;
        });
      } catch (error) {
        eventTracker.trackError(error as Error, "handleWormTap");
      }
    },
    []
  );

  const startGame = useCallback(
    (levelIndex?: number) => {
      try {
        const safeLevel = clampLevel(levelIndex ?? gameState.level);

        // Enable multi-touch handler for advanced touch support
        multiTouchHandler.enable();

        // Start performance monitoring for gameplay
        eventTracker.startPerformanceMonitoring();

        if (GAME_CATEGORIES[safeLevel].requiresSequence) {
          GAME_CATEGORIES[safeLevel].sequenceIndex = 0;
        }

        // Reset emoji appearance tracking for new game
        lastEmojiAppearance.current.clear();

        // Reset target pool for new level (ensures fresh shuffle)
        targetPool.current = [];

        // Reset continuous mode target counter
        continuousModeTargetCount.current = 0;

        // Set continuous mode start time if enabled
        if (continuousMode) {
          setContinuousModeStartTime(Date.now());
        }

        // Initialize emoji rotation tracking in event tracker
        const currentCategory = GAME_CATEGORIES[safeLevel];
        eventTracker.initializeEmojiTracking(currentCategory.items);

        // Reset performance metrics for accurate tracking
        eventTracker.resetPerformanceMetrics();

        const target = generateRandomTarget(safeLevel);
        setGameObjects([]);
        setFairyTransforms([]); // Clear any existing fairy transformations
        setScreenShake(false); // Reset screen shake

        // Clear any existing worm spawn timers
        progressiveSpawnTimeoutRefs.current.forEach((timeout) =>
          clearTimeout(timeout)
        );
        progressiveSpawnTimeoutRefs.current = [];
        if (recurringSpawnIntervalRef.current) {
          clearInterval(recurringSpawnIntervalRef.current);
        }

        // Progressive worm spawning: spawn 5 worms progressively, 3 seconds apart
        setWorms([]); // Start with no worms
        wormSpeedMultiplier.current = 1; // Reset worm speed

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

        // Set up recurring worm spawning: 3 worms every 30 seconds
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
            "game_start"
          );
          return newState;
        });
        setComboCelebration(null);

        // Spawn 2 immediate target emojis when game starts
        setTimeout(() => spawnImmediateTargets(), 100);
      } catch (error) {
        eventTracker.trackError(error as Error, "startGame");
      }
    },
    [
      clampLevel,
      gameState.level,
      generateRandomTarget,
      spawnImmediateTargets,
      createWorms,
    ]
  );

  const resetGame = useCallback(() => {
    GAME_CATEGORIES.forEach((cat) => {
      cat.sequenceIndex = 0;
    });

    // Disable multi-touch handler when game ends
    multiTouchHandler.disable();

    // Stop performance monitoring to save CPU cycles
    eventTracker.stopPerformanceMonitoring();

    // Reset emoji appearance tracking
    lastEmojiAppearance.current.clear();

    // Reset target pool
    targetPool.current = [];

    // Reset performance metrics
    eventTracker.resetPerformanceMetrics();

    // Clear worm spawn timers
    progressiveSpawnTimeoutRefs.current.forEach((timeout) =>
      clearTimeout(timeout)
    );
    progressiveSpawnTimeoutRefs.current = [];
    if (recurringSpawnIntervalRef.current) {
      clearInterval(recurringSpawnIntervalRef.current);
    }

    setGameObjects([]);
    setWorms([]); // Clear worms when game ends
    setFairyTransforms([]); // Clear fairy transformations when game ends
    setScreenShake(false); // Reset screen shake
    wormSpeedMultiplier.current = 1; // Reset worm speed

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
  }, []);

  // REMOVED: Auto-target-change timer - target now only changes when player taps correct object
  // This ensures kindergarteners have enough time to find and tap the correct target

  // REMOVED: Emoji variety management effect - unnecessary complexity that caused performance issues
  // Pure random selection in spawnObject is sufficient for gameplay variety

  // Spawn objects - 8 emojis every 1.5 seconds with guaranteed target visibility
  useEffect(() => {
    if (!gameState.gameStarted || gameState.winner) {
      return;
    }

    const interval = setInterval(spawnObject, 1500); // 1.5 seconds = 1500ms
    return () => clearInterval(interval);
  }, [gameState.gameStarted, gameState.winner, spawnObject]);

  // Combined game loop for objects and worms to ensure synchronization and performance
  useEffect(() => {
    if (!gameState.gameStarted || gameState.winner) {
      return;
    }

    let animationFrameId: number;
    let lastWormTime = performance.now();
    let lastObjectUpdateTime = performance.now();
    const targetFps = 60;
    const frameInterval = 1000 / targetFps;

    const animate = (currentTime: number) => {
      // 1. Worm Update (Variable DT)
      const dt = Math.min((currentTime - lastWormTime) / 16.67, 2);
      lastWormTime = currentTime;

      setWorms((prev) => {
        if (prev.length === 0) return prev;

        // Hoist constants out of map loop (performance optimization)
        const viewportWidth = viewportRef.current.width;
        const viewportHeight = viewportRef.current.height;
        const speedMult = wormSpeedMultiplier.current;

        return prev.map((worm) => {
          if (!worm.alive) return worm;

          // Update position with speed multiplier and delta time
          let newX = worm.x + (worm.vx * speedMult * dt) / 10;
          let newY = worm.y + (worm.vy * speedMult * dt) / 10;

          // Bounce off walls with lane-specific boundaries
          let newVx = worm.vx;
          let newVy = worm.vy;
          const [minX, maxX] = LANE_BOUNDS[worm.lane];

          // Calculate margins to prevent worms from clipping boundaries
          const boundsMarginX = (WORM_SIZE / viewportWidth) * 100;
          const boundsMarginY = WORM_SIZE; // Use pixels for Y boundaries

          if (newX <= minX + boundsMarginX || newX >= maxX - boundsMarginX) {
            newVx = -worm.vx;
            newX = Math.max(
              minX + boundsMarginX,
              Math.min(maxX - boundsMarginX, newX)
            );
          }

          if (newY <= boundsMarginY || newY >= viewportHeight - boundsMarginY) {
            newVy = -worm.vy;
            newY = Math.max(
              boundsMarginY,
              Math.min(viewportHeight - boundsMarginY, newY)
            );
          }

          // Update wiggle phase for animation
          const newWigglePhase = (worm.wigglePhase + 0.1 * dt) % (Math.PI * 2);

          // Update angle based on velocity direction
          const newAngle = Math.atan2(newVy, newVx);

          return {
            ...worm,
            x: newX,
            y: newY,
            vx: newVx,
            vy: newVy,
            angle: newAngle,
            wigglePhase: newWigglePhase,
          };
        });
      });

      // 2. Object Update (Fixed Step)
      const elapsed = currentTime - lastObjectUpdateTime;
      if (elapsed >= frameInterval) {
        updateObjects();
        lastObjectUpdateTime = currentTime - (elapsed % frameInterval);
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameState.gameStarted, gameState.winner, updateObjects]);

  // Separate effect for worm-object collision physics
  // Optimized to run at 30fps instead of 60fps since worm collisions don't need to be frame-perfect
  useEffect(() => {
    if (!gameState.gameStarted || gameState.winner) {
      return;
    }

    let collisionFrameId: number;
    let lastCollisionTime = 0;
    const collisionInterval = 1000 / 30; // 30fps for collision checks

    const applyCollisions = (currentTime: number) => {
      const elapsed = currentTime - lastCollisionTime;

      // Only apply collisions every ~33ms (30fps) instead of every frame (60fps)
      if (elapsed >= collisionInterval) {
        const currentWorms = wormsRef.current;
        const currentObjects = gameObjectsRef.current;

        if (currentWorms.length > 0 && currentObjects.length > 0) {
          setGameObjects((prev) => {
            const updated = [...prev];
            applyWormObjectCollision(currentWorms, updated);
            return updated;
          });
        }

        lastCollisionTime = currentTime - (elapsed % collisionInterval);
      }

      collisionFrameId = requestAnimationFrame(applyCollisions);
    };

    collisionFrameId = requestAnimationFrame(applyCollisions);
    return () => cancelAnimationFrame(collisionFrameId);
  }, [gameState.gameStarted, gameState.winner, applyWormObjectCollision]);

  // Fairy transformation cleanup and currentTime update
  useEffect(() => {
    if (!gameState.gameStarted || gameState.winner) return;

    // Update every 50ms for smooth fairy animation
    const interval = setInterval(() => {
      const now = Date.now();
      // setCurrentTime(now) - Removed for performance optimization (App re-render loop)
      // Remove fairy transforms older than 10 seconds
      setFairyTransforms((prev) =>
        prev.filter((fairy) => now - fairy.createdAt < FAIRY_TRANSFORM_DURATION)
      );
    }, 50);

    return () => clearInterval(interval);
  }, [gameState.gameStarted, gameState.winner]);

  const clearComboCelebration = useCallback(
    () => setComboCelebration(null),
    []
  );

  // Change target to a random emoji from currently visible objects
  const changeTargetToVisibleEmoji = useCallback(() => {
    try {
      // Get unique emojis from currently visible objects
      const visibleEmojis = new Set<string>();
      for (const obj of gameObjectsRef.current) {
        visibleEmojis.add(obj.emoji);
      }

      // Convert to array and filter out current target
      const availableEmojis = Array.from(visibleEmojis).filter(
        (emoji) => emoji !== gameStateRef.current.targetEmoji
      );

      // If no other emojis available, do nothing
      if (availableEmojis.length === 0) {
        if (import.meta.env.DEV) {
          console.log("[TargetDisplay] No other visible emojis to switch to");
        }
        return;
      }

      // Pick a random emoji from visible ones
      const randomEmoji =
        availableEmojis[Math.floor(Math.random() * availableEmojis.length)];

      // Find the corresponding item in current category
      const targetItem = currentCategory.items.find(
        (item) => item.emoji === randomEmoji
      );

      if (!targetItem) {
        if (import.meta.env.DEV) {
          console.log(
            "[TargetDisplay] Could not find item for emoji:",
            randomEmoji
          );
        }
        return;
      }

      // Update game state with new target
      setGameState((prev) => {
        const newState = {
          ...prev,
          currentTarget: targetItem.name,
          targetEmoji: targetItem.emoji,
          targetChangeTime: Date.now() + 10000, // Reset timer
        };
        eventTracker.trackGameStateChange(
          { ...prev },
          { ...newState },
          "manual_target_change_via_click"
        );
        return newState;
      });

      // Spawn 2 immediate target emojis for the new target
      setTimeout(() => spawnImmediateTargets(), 0);

      if (import.meta.env.DEV) {
        console.log("[TargetDisplay] Changed target to:", targetItem.name);
      }
    } catch (error) {
      eventTracker.trackError(error as Error, "changeTargetToVisibleEmoji");
    }
  }, [currentCategory, spawnImmediateTargets]);

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
  };
};
