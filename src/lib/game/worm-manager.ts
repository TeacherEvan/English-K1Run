/**
 * Worm Manager Module
 *
 * Handles worm creation, movement, and lifecycle management.
 * Split from use-game-logic.ts (Jan 2026) for better code organization.
 *
 * @module game/worm-manager
 */

import type { PlayerSide, WormObject } from "../../types/game";
import {
  LANE_BOUNDS,
  WORM_BASE_SPEED,
  WORM_SIZE,
} from "../constants/game-config";

/**
 * Create new worm objects
 * @param count Number of worms to create
 * @param startIndex Starting index for IDs
 */
export function createWorms(count: number, startIndex = 0): WormObject[] {
  return Array.from({ length: count }, (_, i) => {
    const actualIndex = startIndex + i;
    const lane: PlayerSide = actualIndex % 2 === 0 ? "left" : "right";
    const [minX, maxX] = LANE_BOUNDS[lane];

    return {
      id: `worm-${Date.now()}-${actualIndex}`,
      x: Math.random() * (maxX - minX) + minX,
      y: Math.random() * 300 + 100, // Start in visible area (100-400px)
      vx: (Math.random() - 0.5) * WORM_BASE_SPEED * 2,
      vy: (Math.random() - 0.5) * WORM_BASE_SPEED * 2,
      alive: true,
      angle: Math.random() * Math.PI * 2,
      wigglePhase: Math.random() * Math.PI * 2,
      lane,
    };
  });
}

/**
 * Update worm positions based on velocity and boundaries
 */
export function updateWormPosition(
  worm: WormObject,
  dt: number,
  speedMultiplier: number,
  viewportWidth: number,
  viewportHeight: number
): WormObject {
  if (!worm.alive) return worm;

  // Update position with speed multiplier and delta time
  let newX = worm.x + (worm.vx * speedMultiplier * dt) / 10;
  let newY = worm.y + (worm.vy * speedMultiplier * dt) / 10;

  // Bounce off walls with lane-specific boundaries
  let newVx = worm.vx;
  let newVy = worm.vy;
  const [minX, maxX] = LANE_BOUNDS[worm.lane];

  // Calculate margins to prevent worms from clipping boundaries
  const boundsMarginX = (WORM_SIZE / viewportWidth) * 100;
  const boundsMarginY = WORM_SIZE;

  if (newX <= minX + boundsMarginX || newX >= maxX - boundsMarginX) {
    newVx = -worm.vx;
    newX = Math.max(minX + boundsMarginX, Math.min(maxX - boundsMarginX, newX));
  }

  if (newY <= boundsMarginY || newY >= viewportHeight - boundsMarginY) {
    newVy = -worm.vy;
    newY = Math.max(
      boundsMarginY,
      Math.min(viewportHeight - boundsMarginY, newY)
    );
  }

  // Update wiggle phase for animation
  const newWigglePhase = (worm.wigglePhase + 0.1 * dt) % (Math.PI * 2);

  // Update angle based on velocity direction
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
}

/**
 * Update all worms in a batch
 */
export function updateWorms(
  worms: WormObject[],
  dt: number,
  speedMultiplier: number,
  viewportWidth: number,
  viewportHeight: number
): WormObject[] {
  if (worms.length === 0) return worms;

  return worms.map((worm) =>
    updateWormPosition(worm, dt, speedMultiplier, viewportWidth, viewportHeight)
  );
}

/**
 * Kill a worm (mark as not alive)
 */
export function killWorm(worms: WormObject[], wormId: string): WormObject[] {
  return worms.map((worm) =>
    worm.id === wormId ? { ...worm, alive: false } : worm
  );
}

/**
 * Remove dead worms from the array
 */
export function removeDeadWorms(worms: WormObject[]): WormObject[] {
  return worms.filter((worm) => worm.alive);
}

/**
 * Count alive worms
 */
export function countAliveWorms(worms: WormObject[]): number {
  return worms.filter((worm) => worm.alive).length;
}
