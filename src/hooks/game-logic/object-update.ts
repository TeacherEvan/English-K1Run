/**
 * Object Update Helpers
 *
 * Moves falling objects and prunes the ones that leave the play field.
 *
 * Movement runs against the position map owned by `object-motion`, NOT against
 * React state. Only a membership change — an object falling off screen, or
 * being collected — produces a state dispatch, so a frame that merely moves
 * things costs zero reconciliation.
 *
 * Measured before this change, with 31 objects on screen: 49.4 fps, p95 frame
 * 33.4 ms, 1,152 style writes/sec. The old version rebuilt the roster array on
 * every frame, so React reconciled all 31 emoji nodes 60 times a second.
 */

import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import { calculateDynamicSpeed } from "../../lib/constants/engagement-system";
import { EMOJI_SIZE } from "../../lib/constants/game-config";
import { eventTracker } from "../../lib/event-tracker";
import {
  advanceObjectPositions,
  separateLanePositions,
  type ObjectPositions,
} from "../../lib/game/object-motion";
import type { GameObject, GameState } from "../../types/game";

export interface ObjectUpdateDependencies {
  setGameObjects: Dispatch<SetStateAction<GameObject[]>>;
  viewportRef: MutableRefObject<{ width: number; height: number }>;
  gameStateRef: MutableRefObject<GameState>;
  /** Committed roster; read for speeds and lanes, never mutated. */
  gameObjectsRef: MutableRefObject<GameObject[]>;
  /** Live positions, advanced in place every frame. */
  positionsRef: MutableRefObject<ObjectPositions>;
}

export const createObjectUpdater = ({
  setGameObjects,
  viewportRef,
  gameStateRef,
  gameObjectsRef,
  positionsRef,
}: ObjectUpdateDependencies) => {
  const updateObjects = () => {
    try {
      const roster = gameObjectsRef.current;
      if (roster.length === 0) {
        return;
      }

      const screenHeight = viewportRef.current.height;
      const currentProgress = gameStateRef.current.progress;
      const dynamicSpeedMultiplier = calculateDynamicSpeed(currentProgress);
      const speedMultiplier = 1.2 * dynamicSpeedMultiplier;

      const { fallenIds, fallenY } = advanceObjectPositions(
        roster,
        positionsRef.current,
        screenHeight,
        speedMultiplier,
      );

      // Single source of truth for within-lane separation.
      if (roster.length > 1) {
        const left = roster.filter((object) => object.lane === "left");
        const right = roster.filter((object) => object.lane === "right");
        if (left.length > 1) {
          separateLanePositions(left, positionsRef.current, "left");
        }
        if (right.length > 1) {
          separateLanePositions(right, positionsRef.current, "right");
        }
      }

      if (fallenIds.length === 0) {
        return;
      }

      /*
       * Telemetry stays OUT of the state updater. React may invoke an updater
       * more than once for the same commit, and a miss must not be counted
       * twice.
       */
      for (const id of fallenIds) {
        const object = roster.find((entry) => entry.id === id);
        if (!object) {
          continue;
        }
        eventTracker.trackEmojiLifecycle({
          objectId: object.id,
          emoji: object.emoji,
          name: object.type,
          phase: "missed",
          position: {
            x: positionsRef.current.get(object.id)?.x ?? object.x,
            y: Math.min(object.y, screenHeight + EMOJI_SIZE),
          },
          playerSide: object.lane,
          data: {
            reason: "fell_off_screen",
            actualY: object.y,
            calculatedY: fallenY.get(object.id) ?? object.y,
            screenHeight,
          },
        });
      }

      const fallen = new Set(fallenIds);
      setGameObjects((prev) =>
        prev.some((object) => fallen.has(object.id))
          ? prev.filter((object) => !fallen.has(object.id))
          : prev,
      );
    } catch (error) {
      eventTracker.trackError(error as Error, "updateObjects");
    }
  };

  return { updateObjects };
};
