/**
 * Worm-to-object collision resolution for gameplay scenes.
 */

import type { GameObject, WormObject } from "../../types/game";
import { EMOJI_SIZE, LANE_BOUNDS, WORM_SIZE } from "../constants/game-config";
import { calculatePercentageWithinBounds } from "../semantic-utils";

/**
 * Apply worm-to-object collision physics without affecting fall speed.
 */
export function applyWormObjectCollision(
  worms: WormObject[],
  objects: GameObject[],
  viewportWidth: number,
): void {
  if (
    !worms ||
    !objects ||
    worms.length === 0 ||
    objects.length === 0 ||
    viewportWidth <= 0
  ) {
    return;
  }

  const wormCollisionRadius = WORM_SIZE / 2;
  const objectCollisionRadius = EMOJI_SIZE / 2;
  const totalCollisionDistance = wormCollisionRadius + objectCollisionRadius;
  const pushStrengthMultiplier = 0.3;

  for (const worm of worms) {
    if (!worm.alive) {
      continue;
    }

    const wormXPixel = (worm.x / 100) * viewportWidth;
    const wormYPixel = worm.y;

    for (const obj of objects) {
      const objXPixel = (obj.x / 100) * viewportWidth;
      const objYPixel = obj.y;

      const deltaX = objXPixel - wormXPixel;
      const deltaY = objYPixel - wormYPixel;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      if (distance < totalCollisionDistance && distance > 0) {
        const overlap = totalCollisionDistance - distance;
        const pushStrength = overlap * pushStrengthMultiplier;

        const directionX = deltaX / distance;
        const directionY = deltaY / distance;

        const pushXPixel = directionX * pushStrength;
        const pushYPixel = directionY * pushStrength;

        obj.x += (pushXPixel / viewportWidth) * 100;
        obj.y += pushYPixel;

        const [minXBound, maxXBound] = LANE_BOUNDS[obj.lane];
        obj.x = calculatePercentageWithinBounds(obj.x, minXBound, maxXBound);
        obj.y = Math.max(0, obj.y);
      }
    }
  }

  // TODO: [OPTIMIZATION] Consider spatial partitioning if object counts exceed ~500.
}
