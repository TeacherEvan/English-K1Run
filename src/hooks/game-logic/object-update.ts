/**
 * Object Update Helpers
 *
 * Handles movement and collision resolution for falling objects.
 */

import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import { calculateDynamicSpeed } from "../../lib/constants/engagement-system";
import {
  clamp,
  COLLISION_MIN_SEPARATION,
  EMOJI_SIZE,
  LANE_BOUNDS,
  MIN_VERTICAL_GAP,
} from "../../lib/constants/game-config";
import { eventTracker } from "../../lib/event-tracker";
import type { GameObject, GameState, PlayerSide } from "../../types/game";

export interface ObjectUpdateDependencies {
  setGameObjects: Dispatch<SetStateAction<GameObject[]>>;
  viewportRef: MutableRefObject<{ width: number; height: number }>;
  gameStateRef: MutableRefObject<GameState>;
}

const processLane = (laneObjects: GameObject[], lane: PlayerSide) => {
  const laneLength = laneObjects.length;
  if (laneLength === 0) return;

  const [minX, maxX] = LANE_BOUNDS[lane];
  const minSep = COLLISION_MIN_SEPARATION;
  const minVertGap = MIN_VERTICAL_GAP;

  const sorted = laneObjects.slice().sort((a, b) => a.y - b.y);

  for (let i = 0; i < laneLength; i++) {
    const current = sorted[i];

    if (current.y < 0) continue;

    current.x = clamp(current.x, minX, maxX);

    for (let j = i + 1; j < laneLength; j++) {
      const other = sorted[j];

      if (other.y < 0) continue;

      const verticalGap = other.y - current.y;
      if (verticalGap > minVertGap) break;

      const horizontalGap = Math.abs(current.x - other.x);
      if (horizontalGap >= minSep || horizontalGap === 0) continue;

      const overlap = (minSep - horizontalGap) / 2;
      const direction = current.x < other.x ? -1 : 1;

      current.x = clamp(current.x + overlap * direction, minX, maxX);
      other.x = clamp(other.x - overlap * direction, minX, maxX);
    }
  }
};

export const createObjectUpdater = ({
  setGameObjects,
  viewportRef,
  gameStateRef,
}: ObjectUpdateDependencies) => {
  const updateObjects = () => {
    try {
      setGameObjects((prev) => {
        if (prev.length === 0) return prev;

        const screenHeight = viewportRef.current.height;
        const currentProgress = gameStateRef.current.progress;
        const dynamicSpeedMultiplier = calculateDynamicSpeed(currentProgress);
        const speedMultiplier = 1.2 * dynamicSpeedMultiplier;

        const updated: GameObject[] = new Array(prev.length);
        let updatedIndex = 0;

        for (const obj of prev) {
          const newY = obj.y + obj.speed * speedMultiplier;

          if (newY < screenHeight + EMOJI_SIZE) {
            updated[updatedIndex++] = {
              id: obj.id,
              type: obj.type,
              emoji: obj.emoji,
              x: obj.x,
              y: newY,
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

        if (updatedIndex < updated.length) {
          updated.length = updatedIndex;
        }

        if (updated.length > 1) {
          const leftObjects: GameObject[] = [];
          const rightObjects: GameObject[] = [];

          for (const obj of updated) {
            if (obj.lane === "left") {
              leftObjects.push(obj);
            } else {
              rightObjects.push(obj);
            }
          }

          if (leftObjects.length > 1) processLane(leftObjects, "left");
          if (rightObjects.length > 1) processLane(rightObjects, "right");
        }

        return updated;
      });
    } catch (error) {
      eventTracker.trackError(error as Error, "updateObjects");
    }
  };

  return { updateObjects };
};
