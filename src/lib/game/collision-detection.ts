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
  clamp,
  COLLISION_MIN_SEPARATION,
  EMOJI_SIZE,
  LANE_BOUNDS,
  MIN_VERTICAL_GAP,
  WORM_SIZE,
} from "../constants/game-config";

/**
 * Process collision detection for objects in a single lane
 * Uses sorted Y positions for spatial coherence optimization
 */
export function processLaneCollisions(
  laneObjects: GameObject[],
  lane: PlayerSide
): void {
  const laneLength = laneObjects.length;

  // Early exit if no objects to process
  if (laneLength <= 1) return;

  // Cache lane bounds lookup (performance optimization)
  const [minX, maxX] = LANE_BOUNDS[lane];
  const minSep = COLLISION_MIN_SEPARATION;
  const minVertGap = MIN_VERTICAL_GAP;

  // Sort objects by Y position once for better spatial coherence
  // This allows us to break early when objects are too far apart vertically
  const sorted = laneObjects.slice().sort((a, b) => a.y - b.y);

  for (let i = 0; i < laneLength; i++) {
    const current = sorted[i];

    // Skip collision detection for objects still spawning (y < 0)
    // This prevents newly spawned emojis from pushing each other around
    if (current.y < 0) continue;

    // Clamp once before collision checks
    current.x = clamp(current.x, minX, maxX);

    // Only check objects below current (spatial coherence optimization)
    for (let j = i + 1; j < laneLength; j++) {
      const other = sorted[j];

      // Skip collision with objects still spawning (y < 0)
      if (other.y < 0) continue;

      // Early exit: since sorted by Y, if vertical gap too large, all remaining objects are also too far
      const verticalGap = other.y - current.y; // Always positive since sorted
      if (verticalGap > minVertGap) break;

      const horizontalGap = Math.abs(current.x - other.x);

      // Early exit: objects far enough apart horizontally or exactly overlapping
      if (horizontalGap >= minSep || horizontalGap === 0) continue;

      // Apply collision resolution
      const overlap = (minSep - horizontalGap) / 2;
      const direction = current.x < other.x ? -1 : 1;

      current.x = clamp(current.x + overlap * direction, minX, maxX);
      other.x = clamp(other.x - overlap * direction, minX, maxX);
    }
  }
}

/**
 * Apply worm-to-object collision physics
 * Pushes objects away from worms without affecting fall speed
 */
export function applyWormObjectCollision(
  worms: WormObject[],
  objects: GameObject[],
  viewportWidth: number
): void {
  // Skip if no worms or objects
  if (worms.length === 0 || objects.length === 0) return;

  // Collision radius in pixels
  const wormRadiusPx = WORM_SIZE / 2;
  const objectRadiusPx = EMOJI_SIZE / 2;
  const collisionDistancePx = wormRadiusPx + objectRadiusPx;

  // Check each worm against each object
  for (const worm of worms) {
    if (!worm.alive) continue;

    // Convert worm X from percentage to pixels for distance calculation
    const wormXPx = (worm.x / 100) * viewportWidth;
    const wormYPx = worm.y;

    for (const obj of objects) {
      // Convert object X from percentage to pixels
      const objXPx = (obj.x / 100) * viewportWidth;
      const objYPx = obj.y;

      // Calculate distance between worm and object centers
      const dx = objXPx - wormXPx;
      const dy = objYPx - wormYPx;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Check if collision occurred
      if (distance < collisionDistancePx && distance > 0) {
        // Calculate bump force (push object away from worm)
        const overlap = collisionDistancePx - distance;
        const pushStrength = overlap * 0.3; // Moderate push strength

        // Normalize direction vector
        const dirX = dx / distance;
        const dirY = dy / distance;

        // Apply push to object (convert back to percentage for X)
        const pushXPx = dirX * pushStrength;
        const pushYPx = dirY * pushStrength;

        obj.x += (pushXPx / viewportWidth) * 100;
        obj.y += pushYPx;

        // Clamp object position to screen bounds
        const [minX, maxX] = LANE_BOUNDS[obj.lane];
        obj.x = clamp(obj.x, minX, maxX);
        obj.y = Math.max(0, obj.y); // Don't push above screen
      }
    }
  }
}

/**
 * Partition objects by lane for efficient processing
 */
export function partitionByLane(objects: GameObject[]): {
  left: GameObject[];
  right: GameObject[];
} {
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
