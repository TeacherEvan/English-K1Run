/**
 * Falling-object kinematics.
 *
 * Object POSITIONS live here in a mutable map, deliberately outside React
 * state. Measured on the previous design, with 31 objects on screen:
 *
 *   49.4 fps · p95 frame 33.4 ms · max 116.6 ms · 1,152 style writes/sec
 *
 * The rAF loop used to rebuild the `gameObjects` array on every frame, so React
 * reconciled all 31 emoji nodes and rewrote every `style` attribute 60 times a
 * second. Positions belong to the frame clock, not to the reconciler: only
 * MEMBERSHIP changes (spawn, cull, collected) legitimately need a re-render.
 *
 * The roster in React state stays immutable and still carries the spawn x/y for
 * initial paint; everything after that is read from `positions`.
 */

import type { GameObject, PlayerSide } from "../../types/game";
import {
  COLLISION_MIN_SEPARATION,
  EMOJI_SIZE,
  LANE_BOUNDS,
  MIN_VERTICAL_GAP,
} from "../constants/game-config";
import { calculatePercentageWithinBounds } from "../semantic-utils";

export interface ObjectPosition {
  x: number;
  y: number;
}

export type ObjectPositions = Map<string, ObjectPosition>;

/**
 * Seed a position entry from an object's spawn coordinates.
 *
 * Idempotent: re-seeding an existing id would teleport a moving object back to
 * its spawn point.
 */
export const seedPosition = (
  positions: ObjectPositions,
  object: Pick<GameObject, "id" | "x" | "y">,
): void => {
  if (positions.has(object.id)) {
    return;
  }
  positions.set(object.id, { x: object.x, y: object.y });
};

export interface AdvanceResult {
  /** Ids that crossed the bottom cull line during this advance. */
  fallenIds: string[];
  /**
   * The y each fallen object would have reached. Telemetry reports
   * `calculatedY`, so the value has to survive the position entry being
   * dropped.
   */
  fallenY: Map<string, number>;
}

/**
 * Advance every object and report which ones left the play field.
 *
 * Mutates `positions` in place — that is the point. The returned `fallenIds`
 * is the only thing the caller needs to turn into a React state change, and it
 * is empty on almost every frame.
 */
export const advanceObjectPositions = (
  objects: readonly GameObject[],
  positions: ObjectPositions,
  screenHeight: number,
  speedMultiplier: number,
): AdvanceResult => {
  const fallenIds: string[] = [];
  const fallenY = new Map<string, number>();
  const cullLine = screenHeight + EMOJI_SIZE;

  for (const object of objects) {
    const current = positions.get(object.id) ?? {
      x: object.x,
      y: object.y,
    };
    const nextY = current.y + object.speed * speedMultiplier;

    if (nextY < cullLine) {
      positions.set(object.id, { x: current.x, y: nextY });
      continue;
    }

    // Drop the entry with the object, or the map grows for the whole session.
    positions.delete(object.id);
    fallenIds.push(object.id);
    fallenY.set(object.id, nextY);
  }

  return { fallenIds, fallenY };
};

/**
 * Keep objects in a lane from overlapping horizontally.
 *
 * Ported unchanged from `collision-detection-lanes.ts`, which mutated React
 * state objects directly; this operates on the position map instead. The maths
 * — sort by y, break early past the vertical window, push both objects apart by
 * half the overlap, clamp to lane bounds — is identical.
 */
export const separateLanePositions = (
  objects: readonly GameObject[],
  positions: ObjectPositions,
  lane: PlayerSide,
): void => {
  if (objects.length <= 1) {
    return;
  }

  const [minXBound, maxXBound] = LANE_BOUNDS[lane];
  const minimumSeparationDistance = COLLISION_MIN_SEPARATION;
  const maximumVerticalGapForCollisionCheck = MIN_VERTICAL_GAP;

  const laneObjects = [...objects].sort(
    (a, b) => (positions.get(a.id)?.y ?? a.y) - (positions.get(b.id)?.y ?? b.y),
  );

  for (let i = 0; i < laneObjects.length; i += 1) {
    const currentId = laneObjects[i].id;
    const current = positions.get(currentId);
    if (!current || current.y < 0) {
      continue;
    }

    current.x = calculatePercentageWithinBounds(current.x, minXBound, maxXBound);

    for (let j = i + 1; j < laneObjects.length; j += 1) {
      const otherId = laneObjects[j].id;
      const other = positions.get(otherId);
      if (!other || other.y < 0) {
        continue;
      }

      const verticalGap = other.y - current.y;
      if (verticalGap > maximumVerticalGapForCollisionCheck) {
        break;
      }

      const horizontalGap = Math.abs(current.x - other.x);
      if (horizontalGap >= minimumSeparationDistance || horizontalGap === 0) {
        continue;
      }

      const overlap = (minimumSeparationDistance - horizontalGap) / 2;
      const pushDirection = current.x < other.x ? -1 : 1;

      current.x = calculatePercentageWithinBounds(
        current.x + overlap * pushDirection,
        minXBound,
        maxXBound,
      );
      other.x = calculatePercentageWithinBounds(
        other.x - overlap * pushDirection,
        minXBound,
        maxXBound,
      );
    }
  }
};
