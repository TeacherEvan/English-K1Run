/**
 * Object Update Helpers
 *
 * Handles movement for falling objects.
 */

import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import { calculateDynamicSpeed } from "../../lib/constants/engagement-system";
import { EMOJI_SIZE } from "../../lib/constants/game-config";
import { eventTracker } from "../../lib/event-tracker";
import { processLaneCollisions } from "../../lib/game/collision-detection";
import type { GameObject, GameState } from "../../types/game";

export interface ObjectUpdateDependencies {
  setGameObjects: Dispatch<SetStateAction<GameObject[]>>;
  viewportRef: MutableRefObject<{ width: number; height: number }>;
  gameStateRef: MutableRefObject<GameState>;
}

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

        const updated: GameObject[] = [];

        for (const obj of prev) {
          const newY = obj.y + obj.speed * speedMultiplier;

          if (newY < screenHeight + EMOJI_SIZE) {
            updated.push({
              id: obj.id,
              type: obj.type,
              emoji: obj.emoji,
              x: obj.x,
              y: newY,
              speed: obj.speed,
              size: obj.size,
              lane: obj.lane,
            });
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

        // Single source of truth for collision detection
        if (updated.length > 1) {
          const leftObjects = updated.filter((o) => o.lane === "left");
          const rightObjects = updated.filter((o) => o.lane === "right");
          if (leftObjects.length > 1)
            processLaneCollisions(leftObjects, "left");
          if (rightObjects.length > 1)
            processLaneCollisions(rightObjects, "right");
        }

        return updated;
      });
    } catch (error) {
      eventTracker.trackError(error as Error, "updateObjects");
    }
  };

  return { updateObjects };
};
