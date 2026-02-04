import { GAME_CATEGORIES } from "../../lib/constants/game-categories";
import {
  EMOJI_SIZE,
  LANE_BOUNDS,
  MAX_ACTIVE_OBJECTS,
  SPAWN_VERTICAL_GAP,
} from "../../lib/constants/game-config";
import { eventTracker } from "../../lib/event-tracker";
import { calculateSafeSpawnPosition } from "../../lib/utils/spawn-position";
import type { GameObject, PlayerSide } from "../../types/game";
import type { SpawnDependencies } from "./spawn-objects-types";

/**
 * Creates immediate target spawns when the target changes.
 */
export const createSpawnImmediateTargets = ({
  setGameObjects,
  fallSpeedMultiplier,
  gameStateRef,
  lastEmojiAppearance,
}: SpawnDependencies) => {
  return () => {
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
};
