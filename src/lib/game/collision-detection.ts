/**
 * Collision Detection Module
 *
 * Handles physics-based collision detection and resolution for falling objects.
 * Split from use-game-logic.ts (Jan 2026) for better code organization.
 *
 * Key features:
 * - Horizontal-only push forces to preserve fall speed
 * - O(n²) optimized with spatial coherence (sorted by Y)
 * - Lane-specific boundary clamping
 *
 * @module game/collision-detection
 */

import type { GameObject, PlayerSide, WormObject } from "../../types/game";
import {
  COLLISION_MIN_SEPARATION,
  EMOJI_SIZE,
  LANE_BOUNDS,
  MIN_VERTICAL_GAP,
  WORM_SIZE,
} from "../constants/game-config";
import { calculatePercentageWithinBounds } from "../semantic-utils";

/**
 * Process collision detection for objects in a single lane.
 * Uses sorted Y positions for spatial coherence optimization to reduce unnecessary checks.
 *
 * @param laneObjects - Array of game objects in the lane
 * @param lane - The player side ('left' or 'right') for lane-specific bounds
 */
export function processLaneCollisions(
  laneObjects: GameObject[],
  lane: PlayerSide,
): void {
  // Input validation
  if (!laneObjects || laneObjects.length <= 1) {
    return;
  }

  // Cache lane bounds for performance
  const [minXBound, maxXBound] = LANE_BOUNDS[lane];
  const minimumSeparationDistance = COLLISION_MIN_SEPARATION;
  const maximumVerticalGapForCollisionCheck = MIN_VERTICAL_GAP;

  // Sort objects by Y position for spatial coherence optimization
  // This allows early termination when vertical gaps exceed the threshold
  const sortedObjects = laneObjects.slice().sort((a, b) => a.y - b.y);

  for (let i = 0; i < sortedObjects.length; i++) {
    const currentObject = sortedObjects[i];

    // Skip collision detection for objects still spawning (y < 0)
    if (currentObject.y < 0) {
      continue;
    }

    // Clamp position to lane bounds before collision checks
    currentObject.x = calculatePercentageWithinBounds(
      currentObject.x,
      minXBound,
      maxXBound,
    );

    // Check collisions only with objects below (spatial coherence)
    for (let j = i + 1; j < sortedObjects.length; j++) {
      const otherObject = sortedObjects[j];

      // Skip if other object is still spawning
      if (otherObject.y < 0) {
        continue;
      }

      // Early exit: if vertical gap is too large, no more collisions possible
      const verticalGap = otherObject.y - currentObject.y;
      if (verticalGap > maximumVerticalGapForCollisionCheck) {
        break;
      }

      const horizontalGap = Math.abs(currentObject.x - otherObject.x);

      // Early exit: objects are either too far apart or exactly overlapping
      if (horizontalGap >= minimumSeparationDistance || horizontalGap === 0) {
        continue;
      }

      // Calculate collision resolution
      const overlap = (minimumSeparationDistance - horizontalGap) / 2;
      const pushDirection = currentObject.x < otherObject.x ? -1 : 1;

      // Apply equal push to both objects
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

/**
 * Apply worm-to-object collision physics.
 * Pushes objects away from worms without affecting their fall speed.
 *
 * @param worms - Array of worm objects
 * @param objects - Array of game objects
 * @param viewportWidth - Current viewport width in pixels for coordinate conversion
 */
export function applyWormObjectCollision(
  worms: WormObject[],
  objects: GameObject[],
  viewportWidth: number,
): void {
  // Input validation
  if (
    !worms ||
    !objects ||
    worms.length === 0 ||
    objects.length === 0 ||
    viewportWidth <= 0
  ) {
    return;
  }

  // Pre-calculate collision radii
  const wormCollisionRadius = WORM_SIZE / 2;
  const objectCollisionRadius = EMOJI_SIZE / 2;
  const totalCollisionDistance = wormCollisionRadius + objectCollisionRadius;
  const pushStrengthMultiplier = 0.3; // Moderate push strength

  for (const worm of worms) {
    if (!worm.alive) {
      continue;
    }

    // Convert worm position from percentage to pixels
    const wormXPixel = (worm.x / 100) * viewportWidth;
    const wormYPixel = worm.y;

    for (const obj of objects) {
      // Convert object position from percentage to pixels
      const objXPixel = (obj.x / 100) * viewportWidth;
      const objYPixel = obj.y;

      // Calculate distance between centers
      const deltaX = objXPixel - wormXPixel;
      const deltaY = objYPixel - wormYPixel;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      // Check for collision
      if (distance < totalCollisionDistance && distance > 0) {
        // Calculate push force based on overlap
        const overlap = totalCollisionDistance - distance;
        const pushStrength = overlap * pushStrengthMultiplier;

        // Normalize direction vector
        const directionX = deltaX / distance;
        const directionY = deltaY / distance;

        // Calculate pixel-based push
        const pushXPixel = directionX * pushStrength;
        const pushYPixel = directionY * pushStrength;
        // NOTE: This worm-object collision loop is O(n×m) (n = worms, m = objects) and may degrade
        // if object counts exceed ~500; see the optimization TODO below for potential spatial indexing.
        // Apply push and convert back to percentage for X coordinate
        obj.x += (pushXPixel / viewportWidth) * 100;
        obj.y += pushYPixel;

        // Clamp to lane bounds and prevent pushing above screen
        const [minXBound, maxXBound] = LANE_BOUNDS[obj.lane];
        obj.x = calculatePercentageWithinBounds(obj.x, minXBound, maxXBound);
        obj.y = Math.max(0, obj.y);
      }
    }
  }

  // TODO: [OPTIMIZATION] Consider implementing spatial partitioning (e.g., quadtree)
  // for worm-object collisions if object counts exceed ~500 to maintain O(n) performance.
}

/**
 * Partition objects by lane for efficient processing.
 *
 * @param objects - Array of game objects to partition
 * @returns Object with 'left' and 'right' arrays of game objects
 */
export function partitionByLane(objects: GameObject[]): {
  left: GameObject[];
  right: GameObject[];
} {
  // Input validation
  if (!objects) {
    return { left: [], right: [] };
  }

  const left: GameObject[] = [];
  const right: GameObject[] = [];

  for (const obj of objects) {
    if (obj.lane === "left") {
      left.push(obj);
    } else {
      right.push(obj);
    }
  }

  return { left, right };
}
