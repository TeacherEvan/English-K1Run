import {
  LANE_BOUNDS,
  SPAWN_VERTICAL_GAP,
  TARGET_GUARANTEE_COUNT,
} from "../../lib/constants/game-config";
import { eventTracker } from "../../lib/event-tracker";
import { calculateSafeSpawnPosition } from "../../lib/utils/spawn-position";
import type { GameObject, PlayerSide } from "../../types/game";
import { buildObject } from "./spawn-objects-batch-utils";

interface TargetSpawnDeps {
  targetItem: { emoji: string; name: string } | undefined;
  actualSpawnCount: number;
  forceTargetSpawn: boolean;
  fallSpeedMultiplier: number;
  now: number;
  lastEmojiAppearance: Map<string, number>;
  lastTargetSpawnTime: { current: number };
  leftLaneObjects: GameObject[];
  rightLaneObjects: GameObject[];
  createdLeftLane: GameObject[];
  createdRightLane: GameObject[];
  created: GameObject[];
  spawnedInBatch: Set<string>;
}

/**
 * Spawns target objects for the current batch and returns count.
 */
export const spawnTargetObjects = ({
  targetItem,
  actualSpawnCount,
  forceTargetSpawn,
  fallSpeedMultiplier,
  now,
  lastEmojiAppearance,
  lastTargetSpawnTime,
  leftLaneObjects,
  rightLaneObjects,
  createdLeftLane,
  createdRightLane,
  created,
  spawnedInBatch,
}: TargetSpawnDeps) => {
  if (!targetItem) return 0;

  const targetCountToSpawn = forceTargetSpawn
    ? Math.max(1, Math.min(TARGET_GUARANTEE_COUNT, actualSpawnCount))
    : Math.min(TARGET_GUARANTEE_COUNT, actualSpawnCount);

  for (let i = 0; i < targetCountToSpawn; i++) {
    const chosenLane: PlayerSide = Math.random() < 0.5 ? "left" : "right";
    const [minX, maxX] = LANE_BOUNDS[chosenLane];

    spawnedInBatch.add(targetItem.emoji);
    lastEmojiAppearance.set(targetItem.emoji, now);
    lastTargetSpawnTime.current = now;

    eventTracker.trackEmojiAppearance(targetItem.emoji, targetItem.name);

    const initialX = Math.random() * (maxX - minX) + minX;
    const initialY = 0 - i * SPAWN_VERTICAL_GAP;

    const baseLaneObjects =
      chosenLane === "left" ? leftLaneObjects : rightLaneObjects;
    const createdLaneObjects =
      chosenLane === "left" ? createdLeftLane : createdRightLane;
    const laneObjects = [...baseLaneObjects, ...createdLaneObjects];

    const { x: spawnX, y: spawnY } = calculateSafeSpawnPosition({
      initialX,
      initialY,
      existingObjects: laneObjects,
      laneConstraints: { minX, maxX },
    });

    const newObject = buildObject(
      targetItem,
      chosenLane,
      spawnX,
      spawnY,
      fallSpeedMultiplier,
      "target",
      i,
    );

    eventTracker.trackEmojiLifecycle({
      objectId: newObject.id,
      emoji: newObject.emoji,
      name: newObject.type,
      phase: "spawned",
      position: { x: newObject.x, y: newObject.y },
      playerSide: newObject.lane,
    });

    if (chosenLane === "left") {
      createdLeftLane.push(newObject);
    } else {
      createdRightLane.push(newObject);
    }
    created.push(newObject);
  }

  return targetCountToSpawn;
};
