import { describe, expect, it } from "vitest";

import type { GameObject } from "../../../types/game";
import {
  advanceObjectPositions,
  seedPosition,
} from "../object-motion";

/**
 * The frame budget contract for falling objects.
 *
 * Measured before this module existed, with 31 objects on screen: 49.4 fps,
 * p95 frame 33.4 ms, and 1,152 style writes per second — because the rAF loop
 * rebuilt the `gameObjects` array on every frame, so React reconciled all 31
 * emoji nodes and rewrote every `style` attribute 60 times a second.
 *
 * The fix is to move positions out of React state into a mutable map, so a
 * movement-only frame produces NO new array and React bails out.
 */

const makeObject = (overrides: Partial<GameObject> = {}): GameObject => ({
  id: "o1",
  type: "fruit",
  emoji: "🍇",
  x: 50,
  y: 100,
  speed: 1,
  size: 60,
  lane: "left",
  ...overrides,
});

describe("advanceObjectPositions", () => {
  it("moves every object down by speed times the multiplier", () => {
    const positions = new Map<string, { x: number; y: number }>();
    const a = makeObject({ id: "a", y: 100, speed: 1 });
    const b = makeObject({ id: "b", y: 200, speed: 2 });
    seedPosition(positions, a);
    seedPosition(positions, b);

    const result = advanceObjectPositions([a, b], positions, 1000, 3);

    expect(positions.get("a")).toEqual({ x: 50, y: 103 });
    expect(positions.get("b")).toEqual({ x: 50, y: 206 });
    expect(result.fallenIds).toEqual([]);
  });

  it("reports an object that has fallen past the bottom edge once", () => {
    const positions = new Map<string, { x: number; y: number }>();
    // screenHeight 1000 + EMOJI_SIZE 60 = 1060 is the cull line.
    const falling = makeObject({ id: "gone", y: 1059, speed: 5 });
    seedPosition(positions, falling);

    const result = advanceObjectPositions([falling], positions, 1000, 1);

    expect(result.fallenIds).toEqual(["gone"]);
    // A culled object must not keep a live position entry; otherwise the map
    // grows for the whole session.
    expect(positions.has("gone")).toBe(false);
  });

  it("keeps the x coordinate untouched while moving", () => {
    const positions = new Map<string, { x: number; y: number }>();
    const a = makeObject({ id: "a", x: 12.5, y: 10, speed: 1 });
    seedPosition(positions, a);

    advanceObjectPositions([a], positions, 1000, 60);

    expect(positions.get("a")?.x).toBe(12.5);
  });

  it("seeds from the object's spawn coordinates when the map has no entry", () => {
    const positions = new Map<string, { x: number; y: number }>();
    const a = makeObject({ id: "fresh", x: 33, y: 40, speed: 2 });

    advanceObjectPositions([a], positions, 1000, 5);

    expect(positions.get("fresh")).toEqual({ x: 33, y: 50 });
  });
});
