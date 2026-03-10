import { describe, expect, it } from "vitest";
import { applyWormObjectCollision } from "../../../hooks/game-logic/worm-logic";
import type { GameObject, WormObject } from "../../../types/game";

const viewportRef = { current: { width: 1000, height: 800 } };

const createWorm = (overrides: Partial<WormObject> = {}): WormObject => ({
  id: "worm-1",
  x: 50,
  y: 100,
  vx: 0,
  vy: 0,
  alive: true,
  angle: 0,
  wigglePhase: 0,
  lane: "left",
  ...overrides,
});

const createObject = (
  id: string,
  overrides: Partial<GameObject> = {},
): GameObject => ({
  id,
  type: "apple",
  emoji: "🍎",
  x: 50,
  y: 100,
  speed: 1,
  size: 60,
  lane: "left",
  ...overrides,
});

describe("applyWormObjectCollision", () => {
  it("removes only objects that collide with a live worm", () => {
    const worm = createWorm();
    const collided = createObject("collided", { x: 52, y: 105 });
    const safe = createObject("safe", { x: 80, y: 300 });

    const remaining = applyWormObjectCollision([worm], [collided, safe], {
      viewportRef,
    });

    expect(remaining).toEqual([safe]);
  });

  it("keeps all objects when no collisions happen", () => {
    const worm = createWorm();
    const safeA = createObject("safe-a", { x: 10, y: 200 });
    const safeB = createObject("safe-b", { x: 85, y: 320, lane: "right" });
    const objects = [safeA, safeB];

    const remaining = applyWormObjectCollision([worm], objects, {
      viewportRef,
    });

    expect(remaining).toEqual(objects);
  });

  it("ignores dead worms", () => {
    const deadWorm = createWorm({ alive: false });
    const object = createObject("target", { x: 51, y: 102 });

    const remaining = applyWormObjectCollision([deadWorm], [object], {
      viewportRef,
    });

    expect(remaining).toEqual([object]);
  });

  it("removes objects even when perfectly overlapping a worm", () => {
    const worm = createWorm();
    const overlapping = createObject("overlap");

    const remaining = applyWormObjectCollision([worm], [overlapping], {
      viewportRef,
    });

    expect(remaining).toEqual([]);
  });
});
