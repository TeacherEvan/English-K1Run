import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { GameObject, WormObject } from "../../../types/game";
import { useAnimationLoop } from "../game-effects/animation-loop";

/**
 * Regression guard for the animation loop's worm source of truth.
 *
 * The loop used to read `wormsRef.current` immediately after dispatching
 * `setWorms`. Because `useSyncedRef` assigns inside an effect and effects run
 * after paint, that returned the PREVIOUS commit — so collision resolved
 * against last frame's worm positions. The error scales with frame time, so it
 * is twice as far at 30 fps as at 60: invisible on a developer desktop, real on
 * a classroom tablet.
 *
 * The decisive case below places an object that does NOT overlap the worm at
 * t0 but DOES after one frame of travel. On the old code the object survives;
 * on the fixed code it is removed.
 */

let frameQueue: FrameRequestCallback[] = [];

const BASE_TIME = 1000;
const FRAME_MS = 16.67;

const runFrame = (offsetMs: number) => {
  const callbacks = frameQueue;
  frameQueue = [];
  act(() => {
    for (const cb of callbacks) cb(BASE_TIME + offsetMs);
  });
};

const makeWorm = (overrides: Partial<WormObject> = {}): WormObject => ({
  id: "worm-1",
  x: 50, // 50% of a 1000px viewport → 500px, so it shares the object's column
  y: 500,
  vx: 0,
  vy: 400, // 400 * dt / 10 → 40px per frame at dt = 1
  alive: true,
  angle: 0,
  wigglePhase: 0,
  lane: "left",
  ...overrides,
});

const makeObject = (overrides: Partial<GameObject> = {}): GameObject => ({
  id: "object-1",
  type: "fruit",
  emoji: "🍇",
  x: 50,
  y: 580,
  speed: 1,
  size: 60,
  lane: "left",
  ...overrides,
});

interface Harness {
  root: Root;
  container: HTMLDivElement;
  setWorms: ReturnType<typeof vi.fn>;
  setGameObjects: ReturnType<typeof vi.fn>;
  updateObjects: ReturnType<typeof vi.fn>;
}

const mount = (worms: WormObject[], objects: GameObject[] = []): Harness => {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  const setWorms = vi.fn();
  const setGameObjects = vi.fn();
  const updateObjects = vi.fn();
  const viewportRef = { current: { width: 1000, height: 1000 } };
  const wormSpeedMultiplier = { current: 1 };
  const wormsRef = { current: worms };
  const gameObjectsRef = { current: objects };
  const positionsRef = {
    current: new Map(objects.map((o) => [o.id, { x: o.x, y: o.y }])),
  };

  function Probe() {
    useAnimationLoop(
      true,
      false,
      updateObjects,
      setWorms as never,
      setGameObjects as never,
      viewportRef,
      wormSpeedMultiplier,
      gameObjectsRef,
      wormsRef,
      positionsRef,
    );
    return null;
  }

  act(() => {
    root.render(<Probe />);
  });

  return { root, container, setWorms, setGameObjects, updateObjects };
};

beforeEach(() => {
  frameQueue = [];
  vi.spyOn(performance, "now").mockReturnValue(BASE_TIME);
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    frameQueue.push(cb);
    return frameQueue.length;
  });
  vi.stubGlobal("cancelAnimationFrame", () => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  document.body.innerHTML = "";
});

describe("useAnimationLoop", () => {
  it("does not dispatch a worm update while the board has no worms", () => {
    const h = mount([]);

    runFrame(FRAME_MS);
    runFrame(FRAME_MS * 2);
    runFrame(FRAME_MS * 3);

    // updateWormPositions returns the same reference for an empty array, so a
    // dispatch here would be a wasted state write every single frame.
    expect(h.setWorms).not.toHaveBeenCalled();

    act(() => h.root.unmount());
  });

  it("resolves collision against the worm positions it just computed", () => {
    const object = makeObject();
    const h = mount([makeWorm()], [object]);

    runFrame(FRAME_MS);

    expect(h.setGameObjects).toHaveBeenCalledTimes(1);
    const survivors = h.setGameObjects.mock.calls[0][0] as GameObject[];

    // Worm travels 500 → 540. The object sits at 580 with a 60px collision
    // radius, so it collides only if the loop used the NEW position. Reading
    // the stale commit (500) leaves an 80px gap and the object survives.
    expect(survivors).toHaveLength(0);

    act(() => h.root.unmount());
  });

  it("clamps a post-stall frame delta so a tab-switch cannot teleport a worm", () => {
    const h = mount([makeWorm()]);

    // A 10s gap (backgrounded tab) must be treated as 2 frames, not 600.
    runFrame(10_000);

    const dispatched = h.setWorms.mock.calls[0][0] as WormObject[];
    expect(dispatched[0].y).toBe(580); // 500 + (400 * 2 / 10)

    act(() => h.root.unmount());
  });

  it("keeps the 60 Hz object-update gate while running at 120 Hz", () => {
    const h = mount([makeWorm()]);

    // Six 120Hz frames (8.33ms) span ~50ms → ~3 object updates, not 6.
    for (let i = 1; i <= 6; i += 1) runFrame((FRAME_MS / 2) * i);

    expect(h.updateObjects.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(h.updateObjects.mock.calls.length).toBeLessThanOrEqual(3);

    act(() => h.root.unmount());
  });
});
