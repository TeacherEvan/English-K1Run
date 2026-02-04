/**
 * Utility functions for worm entity management
 */

import { BASE_SPEED, WORM_COUNT, WORM_SIZE } from "./constants";
import type { Worm } from "./types";

/**
 * Initialize worms with random positions and velocities
 */
export const createInitialWorms = (): Worm[] => {
  return Array.from({ length: WORM_COUNT }, (_, i) => ({
    id: i,
    x: Math.random() * 80 + 10, // 10-90% of screen width
    y: Math.random() * 80 + 10, // 10-90% of screen height
    vx: (Math.random() - 0.5) * BASE_SPEED * 2,
    vy: (Math.random() - 0.5) * BASE_SPEED * 2,
    alive: true,
    angle: Math.random() * Math.PI * 2,
    wigglePhase: Math.random() * Math.PI * 2,
  }));
};

/**
 * Calculate updated worm position with wall bouncing
 */
export const calculateWormUpdate = (
  worm: Worm,
  speedMultiplier: number,
  containerWidth: number,
  containerHeight: number,
): Worm => {
  // Early return for dead worms to avoid unnecessary calculations
  if (!worm.alive) return worm;

  // Update position
  let newX = worm.x + (worm.vx * speedMultiplier) / 10;
  let newY = worm.y + (worm.vy * speedMultiplier) / 10;

  // Bounce off walls with percentage-based positioning
  let newVx = worm.vx;
  let newVy = worm.vy;
  const boundsMarginX = (WORM_SIZE / containerWidth) * 100;
  const boundsMarginY = (WORM_SIZE / containerHeight) * 100;

  if (newX <= boundsMarginX || newX >= 100 - boundsMarginX) {
    newVx = -worm.vx;
    newX = Math.max(boundsMarginX, Math.min(100 - boundsMarginX, newX));
  }

  if (newY <= boundsMarginY || newY >= 100 - boundsMarginY) {
    newVy = -worm.vy;
    newY = Math.max(boundsMarginY, Math.min(100 - boundsMarginY, newY));
  }

  // Update wiggle phase for animation (normalized to prevent overflow)
  const newWigglePhase = (worm.wigglePhase + 0.1) % (Math.PI * 2);

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
};
