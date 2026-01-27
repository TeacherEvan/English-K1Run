/**
 * Object Spawn Helpers
 */

import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import { GAME_CATEGORIES } from "../../lib/constants/game-categories";
import {
  EMOJI_SIZE,
  LANE_BOUNDS,
  MAX_ACTIVE_OBJECTS,
  MIN_DECOY_SLOTS,
  ROTATION_THRESHOLD,
  SPAWN_COUNT,
  SPAWN_VERTICAL_GAP,
  TARGET_GUARANTEE_COUNT,
} from "../../lib/constants/game-config";
import { eventTracker } from "../../lib/event-tracker";
import { calculateSafeSpawnPosition } from "../../lib/utils/spawn-position";
import type { GameObject, GameState, PlayerSide } from "../../types/game";

export interface SpawnDependencies {
  setGameObjects: Dispatch<SetStateAction<GameObject[]>>;
  fallSpeedMultiplier: number;
  gameStateRef: MutableRefObject<GameState>;
  lastEmojiAppearance: MutableRefObject<Map<string, number>>;
  lastTargetSpawnTime: MutableRefObject<number>;
  staleEmojisCache: MutableRefObject<{
    emojis: Array<{ emoji: string; name: string }>;
    timestamp: number;
  }>;
}

export const createSpawnHandlers = (dependencies: SpawnDependencies) => {
  const {
    setGameObjects,
    fallSpeedMultiplier,
    gameStateRef,
    lastEmojiAppearance,
    lastTargetSpawnTime,
    staleEmojisCache,
  } = dependencies;

  const spawnImmediateTargets = () => {
    try {
      setGameObjects((prev) => {
        if (prev.length >= MAX_ACTIVE_OBJECTS - 2) {
          return prev;
        }

        const level =
          GAME_CATEGORIES[gameStateRef.current.level] || GAME_CATEGORIES[0];
        const currentTarget = gameStateRef.current.targetEmoji;
        const targetItem = level.items.find(
          (item) => item.emoji === currentTarget,
        );

        if (!targetItem) {
          return prev;
        }

        const created: GameObject[] = [];
        const now = Date.now();

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

        for (let i = 0; i < 2; i++) {
          const lane: PlayerSide = i === 0 ? "left" : "right";
          const [minX, maxX] = LANE_BOUNDS[lane];

          lastEmojiAppearance.current.set(targetItem.emoji, now);
          eventTracker.trackEmojiAppearance(targetItem.emoji, targetItem.name);

          const initialX = Math.random() * (maxX - minX) + minX;
          const initialY = 0 - i * SPAWN_VERTICAL_GAP;

          const baseLaneObjects =
            lane === "left" ? leftLaneObjects : rightLaneObjects;
          const createdLaneObjects =
            lane === "left" ? createdLeftLane : createdRightLane;
          const laneObjects = [...baseLaneObjects, ...createdLaneObjects];

          const { x: spawnX, y: spawnY } = calculateSafeSpawnPosition({
            initialX,
            initialY,
            existingObjects: laneObjects,
            laneConstraints: { minX, maxX },
          });

          const newObject: GameObject = {
            id: `immediate-target-${Date.now()}-${i}-${Math.random()
              .toString(36)
              .slice(2, 8)}`,
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
  };

  const spawnObject = () => {
    try {
      setGameObjects((prev) => {
        const now = Date.now();
        const timeSinceLastTarget = now - lastTargetSpawnTime.current;
        const forceTargetSpawn = timeSinceLastTarget > 6000;

        const level =
          GAME_CATEGORIES[gameStateRef.current.level] || GAME_CATEGORIES[0];
        const currentTarget = gameStateRef.current.targetEmoji;

        const requiredSlots = TARGET_GUARANTEE_COUNT + MIN_DECOY_SLOTS;
        const maxObjectsBeforeSpawn = MAX_ACTIVE_OBJECTS - requiredSlots;

        let workingList = [...prev];
        if (workingList.length > maxObjectsBeforeSpawn) {
          const targetEmoji = currentTarget;
          let targetCountOnScreen = 0;
          const idsToRemove = new Set<string>();
          let removedCount = 0;

          const screenHeight =
            typeof window !== "undefined" ? window.innerHeight : 1080;
          const offScreenThreshold = screenHeight * 0.8;

          const candidates: Array<{
            id: string;
            y: number;
            isTarget: boolean;
          }> = [];
          for (const obj of workingList) {
            const isTarget = !!(targetEmoji && obj.emoji === targetEmoji);
            if (isTarget) targetCountOnScreen++;
            if (obj.y >= offScreenThreshold) {
              candidates.push({ id: obj.id, y: obj.y, isTarget });
            }
          }

          candidates.sort((a, b) => b.y - a.y);

          for (const candidate of candidates) {
            if (workingList.length - removedCount <= maxObjectsBeforeSpawn) {
              break;
            }

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

          if (removedCount > 0) {
            workingList = workingList.filter((obj) => !idsToRemove.has(obj.id));
            if (import.meta.env.DEV) {
              console.log(
                `[SpawnObject] Trimmed ${removedCount} old objects to reserve decoy slots`,
              );
            }
          }
        }

        const availableSlots = Math.max(
          0,
          MAX_ACTIVE_OBJECTS - workingList.length,
        );

        let actualSpawnCount = Math.min(availableSlots, SPAWN_COUNT);
        if (forceTargetSpawn && actualSpawnCount <= 0) {
          actualSpawnCount = 1;
        }

        const created: GameObject[] = [];

        if (actualSpawnCount <= 0) {
          return prev;
        }

        const spawnedInBatch = new Set<string>();
        const activeEmojis = new Set<string>();
        for (const obj of workingList) {
          activeEmojis.add(obj.emoji);
        }

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

        let staleEmojis: Array<{ emoji: string; name: string }>;

        if (now - staleEmojisCache.current.timestamp > 5000) {
          staleEmojis = level.items.filter((item) => {
            const lastSeen = lastEmojiAppearance.current.get(item.emoji);
            return !lastSeen || now - lastSeen > ROTATION_THRESHOLD;
          });
          staleEmojisCache.current = { emojis: staleEmojis, timestamp: now };
        } else {
          staleEmojis = staleEmojisCache.current.emojis;
        }

        const selectItem = () => {
          if (staleEmojis.length > 0 && Math.random() < 0.7) {
            return staleEmojis[Math.floor(Math.random() * staleEmojis.length)];
          }
          return level.items[Math.floor(Math.random() * level.items.length)];
        };

        const targetItem = level.items.find(
          (item) => item.emoji === currentTarget,
        );
        let targetSpawnCount = 0;

        if (targetItem) {
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
            lastTargetSpawnTime.current = now;
            targetSpawnCount++;

            eventTracker.trackEmojiAppearance(item.emoji, item.name);

            const initialX = Math.random() * (maxX - minX) + minX;
            const initialY = 0 - i * SPAWN_VERTICAL_GAP;

            const baseLaneObjects =
              lane === "left" ? leftLaneObjects : rightLaneObjects;
            const createdLaneObjects =
              lane === "left" ? createdLeftLane : createdRightLane;
            const laneObjects = [...baseLaneObjects, ...createdLaneObjects];

            const { x: spawnX, y: spawnY } = calculateSafeSpawnPosition({
              initialX,
              initialY,
              existingObjects: laneObjects,
              laneConstraints: { minX, maxX },
            });

            const newObject: GameObject = {
              id: `target-${Date.now()}-${i}-${Math.random()
                .toString(36)
                .slice(2, 8)}`,
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

            if (lane === "left") {
              createdLeftLane.push(newObject);
            } else {
              createdRightLane.push(newObject);
            }
            created.push(newObject);
          }
        }

        for (let i = targetSpawnCount; i < actualSpawnCount; i++) {
          const { minX, maxX, lane } = (() => {
            const chosenLane: PlayerSide =
              Math.random() < 0.5 ? "left" : "right";
            const [laneMin, laneMax] = LANE_BOUNDS[chosenLane];
            return { minX: laneMin, maxX: laneMax, lane: chosenLane };
          })();

          let item = selectItem();

          const isDuplicateInBatch = spawnedInBatch.has(item.emoji);
          const isDuplicateActive = activeEmojis.has(item.emoji);

          if (
            isDuplicateInBatch ||
            (isDuplicateActive && Math.random() > 0.3)
          ) {
            let attempts = 0;
            const maxAttempts = level.items.length * 2;

            while (attempts < maxAttempts) {
              item = selectItem();
              attempts++;

              if (
                !spawnedInBatch.has(item.emoji) &&
                (!activeEmojis.has(item.emoji) || Math.random() <= 0.3)
              ) {
                break;
              }
            }
          }

          spawnedInBatch.add(item.emoji);
          lastEmojiAppearance.current.set(item.emoji, now);

          eventTracker.trackEmojiAppearance(item.emoji, item.name);

          const initialX = Math.random() * (maxX - minX) + minX;
          const initialY = 0 - i * SPAWN_VERTICAL_GAP;

          const baseLaneObjects =
            lane === "left" ? leftLaneObjects : rightLaneObjects;
          const createdLaneObjects =
            lane === "left" ? createdLeftLane : createdRightLane;
          const laneObjects = [...baseLaneObjects, ...createdLaneObjects];

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
  };

  return { spawnImmediateTargets, spawnObject };
};
