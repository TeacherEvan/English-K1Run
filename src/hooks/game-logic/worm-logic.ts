/**
 * Worm Logic Helpers
 */

import type { MutableRefObject } from "react";
import {
  EMOJI_SIZE,
  LANE_BOUNDS,
  WORM_BASE_SPEED,
  WORM_SIZE,
} from "../../lib/constants/game-config";
import { generateUniqueIdentifier } from "../../lib/semantic-utils";
import type { GameObject, PlayerSide, WormObject } from "../../types/game";

export interface WormCollisionContext {
  viewportRef: MutableRefObject<{ width: number; height: number }>;
}

export const applyWormObjectCollision = (
  worms: WormObject[],
  objects: GameObject[],
  context: WormCollisionContext,
) => {
  if (worms.length === 0 || objects.length === 0) return objects;

  const viewportWidth = context.viewportRef.current.width;
  const wormRadiusPx = WORM_SIZE / 2;
  const objectRadiusPx = EMOJI_SIZE / 2;
  const collisionDistancePx = wormRadiusPx + objectRadiusPx;
  const collidedObjectIds = new Set<string>();

  for (const worm of worms) {
    if (!worm.alive) continue;

    const wormXPx = (worm.x / 100) * viewportWidth;
    const wormYPx = worm.y;

    for (const obj of objects) {
      const objXPx = (obj.x / 100) * viewportWidth;
      const objYPx = obj.y;

      const dx = objXPx - wormXPx;
      const dy = objYPx - wormYPx;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= collisionDistancePx) {
        collidedObjectIds.add(obj.id);
      }
    }
  }

  if (collidedObjectIds.size === 0) return objects;

  return objects.filter((obj) => !collidedObjectIds.has(obj.id));
};

export const createWorms = (count: number, startIndex = 0): WormObject[] => {
  return Array.from({ length: count }, (_, i) => {
    const actualIndex = startIndex + i;
    const lane: PlayerSide = actualIndex % 2 === 0 ? "left" : "right";
    const [minX, maxX] = LANE_BOUNDS[lane];
    return {
      id: generateUniqueIdentifier(`worm-${actualIndex}`),
      x: Math.random() * (maxX - minX) + minX,
      y: Math.random() * 300 + 100,
      vx: (Math.random() - 0.5) * WORM_BASE_SPEED * 2,
      vy: (Math.random() - 0.5) * WORM_BASE_SPEED * 2,
      alive: true,
      angle: Math.random() * Math.PI * 2,
      wigglePhase: Math.random() * Math.PI * 2,
      lane,
    };
  });
};

export const updateWormPositions = (
  worms: WormObject[],
  dt: number,
  viewportRef: MutableRefObject<{ width: number; height: number }>,
  wormSpeedMultiplier: MutableRefObject<number>,
): WormObject[] => {
  if (worms.length === 0) return worms;

  const viewportWidth = viewportRef.current.width;
  const viewportHeight = viewportRef.current.height;
  const speedMult = wormSpeedMultiplier.current;

  return worms.map((worm) => {
    if (!worm.alive) return worm;

    let newX = worm.x + (worm.vx * speedMult * dt) / 10;
    let newY = worm.y + (worm.vy * speedMult * dt) / 10;

    let newVx = worm.vx;
    let newVy = worm.vy;
    const [minX, maxX] = LANE_BOUNDS[worm.lane];

    const boundsMarginX = (WORM_SIZE / viewportWidth) * 100;
    const boundsMarginY = WORM_SIZE;

    if (newX <= minX + boundsMarginX || newX >= maxX - boundsMarginX) {
      newVx = -worm.vx;
      newX = Math.max(
        minX + boundsMarginX,
        Math.min(maxX - boundsMarginX, newX),
      );
    }

    if (newY <= boundsMarginY || newY >= viewportHeight - boundsMarginY) {
      newVy = -worm.vy;
      newY = Math.max(
        boundsMarginY,
        Math.min(viewportHeight - boundsMarginY, newY),
      );
    }

    const newWigglePhase = (worm.wigglePhase + 0.1 * dt) % (Math.PI * 2);
    const newAngle = Math.atan2(newVy, newVx);

    return {
      ...worm,
      x: newX,
      y: newY,
      vx: newVx,
      vy: newVy,
      angle: newAngle,
      wigglePhase: newWigglePhase,
    };
  });
};
