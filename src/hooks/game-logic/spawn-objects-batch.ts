import { GAME_CATEGORIES } from "../../lib/constants/game-categories";
import {
  MAX_ACTIVE_OBJECTS,
  MIN_DECOY_SLOTS,
  SPAWN_COUNT,
  TARGET_GUARANTEE_COUNT,
} from "../../lib/constants/game-config";
import { eventTracker } from "../../lib/event-tracker";
import type { GameObject } from "../../types/game";
import { spawnDecoyObjects } from "./spawn-objects-batch-decoys";
import { runOverflowPruneCheck } from "./spawn-objects-batch-prune";
import {
  createItemSelector,
  getStaleEmojis,
} from "./spawn-objects-batch-selection";
import { spawnTargetObjects } from "./spawn-objects-batch-targets";
import { splitLaneObjects } from "./spawn-objects-batch-utils";
import type { SpawnDependencies } from "./spawn-objects-types";

/**
 * Creates standard batch spawns for active gameplay.
 */
export const createSpawnObject = ({
  setGameObjects,
  fallSpeedMultiplier,
  gameStateRef,
  lastEmojiAppearance,
  lastTargetSpawnTime,
  staleEmojisCache,
}: SpawnDependencies) => {
  return () => {
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

        const workingList = [...prev];
        if (workingList.length > maxObjectsBeforeSpawn) {
          runOverflowPruneCheck(
            workingList,
            currentTarget,
            maxObjectsBeforeSpawn,
          );
        }

        const availableSlots = Math.max(
          0,
          MAX_ACTIVE_OBJECTS - workingList.length,
        );

        let actualSpawnCount = Math.min(availableSlots, SPAWN_COUNT);
        if (forceTargetSpawn && actualSpawnCount <= 0) {
          actualSpawnCount = 1;
        }

        if (actualSpawnCount <= 0) {
          return prev;
        }

        const created: GameObject[] = [];
        const spawnedInBatch = new Set<string>();
        const activeEmojis = new Set<string>(
          workingList.map((obj) => obj.emoji),
        );
        const { leftLaneObjects, rightLaneObjects } =
          splitLaneObjects(workingList);
        const createdLeftLane: GameObject[] = [];
        const createdRightLane: GameObject[] = [];

        const updatedCache = getStaleEmojis({
          now,
          levelItems: level.items,
          lastEmojiAppearance: lastEmojiAppearance.current,
          staleEmojisCache: staleEmojisCache.current,
        });
        staleEmojisCache.current = updatedCache;
        const selectItem = createItemSelector(level.items, updatedCache.emojis);

        const targetItem = level.items.find(
          (item) => item.emoji === currentTarget,
        );

        let targetSpawnCount = 0;
        if (targetItem) {
          targetSpawnCount = spawnTargetObjects({
            targetItem,
            actualSpawnCount,
            forceTargetSpawn,
            fallSpeedMultiplier,
            now,
            lastEmojiAppearance: lastEmojiAppearance.current,
            lastTargetSpawnTime,
            leftLaneObjects,
            rightLaneObjects,
            createdLeftLane,
            createdRightLane,
            created,
            spawnedInBatch,
          });
        }

        spawnDecoyObjects({
          startIndex: targetSpawnCount,
          actualSpawnCount,
          selectItem,
          spawnedInBatch,
          activeEmojis,
          lastEmojiAppearance: lastEmojiAppearance.current,
          now,
          fallSpeedMultiplier,
          leftLaneObjects,
          rightLaneObjects,
          createdLeftLane,
          createdRightLane,
          created,
        });

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
};
