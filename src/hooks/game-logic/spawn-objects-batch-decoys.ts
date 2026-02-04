import {
  LANE_BOUNDS,
  SPAWN_VERTICAL_GAP,
} from "../../lib/constants/game-config";
import { eventTracker } from "../../lib/event-tracker";
import { calculateSafeSpawnPosition } from "../../lib/utils/spawn-position";
import type { GameObject, PlayerSide } from "../../types/game";
import { buildObject } from "./spawn-objects-batch-utils";

interface DecoySpawnDeps {
  startIndex: number;
  actualSpawnCount: number;
  selectItem: () => { emoji: string; name: string };
  spawnedInBatch: Set<string>;
  /** Set of emojis currently active on screen */
  activeEmojis: Set<string>;
  /** Map of emoji to last appearance timestamp (epoch milliseconds) */
  lastEmojiAppearance: Map<string, number>;
  /** Current timestamp for spawn timing */
  now: number;
  fallSpeedMultiplier: number;
  leftLaneObjects: GameObject[];
  rightLaneObjects: GameObject[];
  createdLeftLane: GameObject[];
  createdRightLane: GameObject[];
  created: GameObject[];
}

/**
 * Spawns decoy objects for the batch.
 */
export const spawnDecoyObjects = (deps: DecoySpawnDeps) => {
  const {
    startIndex,
    actualSpawnCount,
    selectItem,
    spawnedInBatch,
    activeEmojis,
    lastEmojiAppearance,
    now,
    fallSpeedMultiplier,
    leftLaneObjects,
    rightLaneObjects,
    createdLeftLane,
    createdRightLane,
    created,
  } = deps;

  if (!activeEmojis || !lastEmojiAppearance || typeof now !== "number") {
    console.error("[spawnDecoyObjects] Invalid dependencies", deps);
    return;
  }

  for (let i = startIndex; i < actualSpawnCount; i++) {
    const chosenLane: PlayerSide = Math.random() < 0.5 ? "left" : "right";
    const [minX, maxX] = LANE_BOUNDS[chosenLane];

    let item = selectItem();
    const isDuplicateInBatch = spawnedInBatch.has(item.emoji);
    const isDuplicateActive = activeEmojis.has(item.emoji);

    if (isDuplicateInBatch || (isDuplicateActive && Math.random() > 0.3)) {
      let attempts = 0;
      const maxAttempts = activeEmojis.size * 2;

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

    if (spawnedInBatch && item.emoji) {
      spawnedInBatch.add(item.emoji);
    }
    if (lastEmojiAppearance && item.emoji && typeof now === "number") {
      lastEmojiAppearance.set(item.emoji, now);
    }

    eventTracker.trackEmojiAppearance(item.emoji, item.name);

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
      item,
      chosenLane,
      spawnX,
      spawnY,
      fallSpeedMultiplier,
      null,
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
};
