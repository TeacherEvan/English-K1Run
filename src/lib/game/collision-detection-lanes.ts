/**
 * Lane-based collision detection.
 *
 * Keeps falling objects separated inside each lane. This is the only module
 * under `lib/game/`: the sibling `worm-manager.ts`, `collision-detection-worm.ts`
 * and their barrels were a dead parallel implementation of `hooks/game-logic/`
 * that advertised a differently-behaved `applyWormObjectCollision`, and have
 * been removed.
 */

import type { GameObject, PlayerSide } from "../../types/game";
import {
  COLLISION_MIN_SEPARATION,
  LANE_BOUNDS,
  MIN_VERTICAL_GAP,
} from "../constants/game-config";
import { calculatePercentageWithinBounds } from "../semantic-utils";

/**
 * Process collision detection for objects in a single lane.
 */
export function processLaneCollisions(
  laneObjects: GameObject[],
  lane: PlayerSide,
): void {
  if (!laneObjects || laneObjects.length <= 1) {
    return;
  }

  const [minXBound, maxXBound] = LANE_BOUNDS[lane];
  const minimumSeparationDistance = COLLISION_MIN_SEPARATION;
  const maximumVerticalGapForCollisionCheck = MIN_VERTICAL_GAP;

  const sortedObjects = laneObjects.slice().sort((a, b) => a.y - b.y);

  for (let i = 0; i < sortedObjects.length; i++) {
    const currentObject = sortedObjects[i];

    if (currentObject.y < 0) {
      continue;
    }

    currentObject.x = calculatePercentageWithinBounds(
      currentObject.x,
      minXBound,
      maxXBound,
    );

    for (let j = i + 1; j < sortedObjects.length; j++) {
      const otherObject = sortedObjects[j];

      if (otherObject.y < 0) {
        continue;
      }

      const verticalGap = otherObject.y - currentObject.y;
      if (verticalGap > maximumVerticalGapForCollisionCheck) {
        break;
      }

      const horizontalGap = Math.abs(currentObject.x - otherObject.x);

      if (horizontalGap >= minimumSeparationDistance || horizontalGap === 0) {
        continue;
      }

      const overlap = (minimumSeparationDistance - horizontalGap) / 2;
      const pushDirection = currentObject.x < otherObject.x ? -1 : 1;

      currentObject.x = calculatePercentageWithinBounds(
        currentObject.x + overlap * pushDirection,
        minXBound,
        maxXBound,
      );
      otherObject.x = calculatePercentageWithinBounds(
        otherObject.x - overlap * pushDirection,
        minXBound,
        maxXBound,
      );
    }
  }
}
