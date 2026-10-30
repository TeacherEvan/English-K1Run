import { beforeEach, describe, expect, it, vi } from "vitest";

import type { GameObject, GameState } from "../../../types/game";

vi.mock("../../../lib/event-tracker", () => ({
  eventTracker: {
    trackEmojiLifecycle: vi.fn(),
    trackError: vi.fn(),
  },
}));

import { createObjectUpdater } from "../object-update";

/**
 * Roster membership is the only thing that may reach React.
 *
 * Measured before this change, with 31 objects on screen: 49.4 fps, p95 frame
 * 33.4 ms, 1,152 style writes/sec. The old updater rebuilt the roster array on
 * EVERY frame, so React reconciled all 31 emoji nodes 60 times a second.
 *
 * Movement now lives in a position map. A frame that only moves objects must
 * dispatch nothing at all.
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

const makeGameState = (): GameState => ({
  progress: 0,
  currentTarget: "grape",
  targetEmoji: "🍇",
  level: 0,
  gameStarted: true,
  winner: false,
  targetChangeTime: 0,
  streak: 0,
  announcementActive: false,
  announcementEmoji: "",
  announcementSentence: "",
  multiplier: 1,
  lastMilestone: 0,
});

const mountUpdater = (roster: GameObject[]) => {
  const setGameObjects = vi.fn();
  const viewportRef = { current: { width: 1000, height: 1000 } };
  const gameStateRef = { current: makeGameState() };
  const positionsRef = { current: new Map<string, { x: number; y: number }>() };
  const gameObjectsRef = { current: roster };

  const { updateObjects } = createObjectUpdater({
    setGameObjects: setGameObjects as never,
    viewportRef,
    gameStateRef,
    gameObjectsRef,
    positionsRef,
  });

  return { updateObjects, setGameObjects, positionsRef, gameObjectsRef };
};

/** Invoke the updater React would receive, against the committed roster. */
const applyUpdater = (
  setGameObjects: ReturnType<typeof vi.fn>,
  roster: GameObject[],
): GameObject[] => {
  const updater = setGameObjects.mock.calls.at(-1)?.[0] as (
    prev: GameObject[],
  ) => GameObject[];
  return updater(roster);
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createObjectUpdater roster membership", () => {
  it("dispatches nothing at all when objects only move", () => {
    const roster = [makeObject({ id: "a", y: 100 }), makeObject({ id: "b", y: 200 })];
    const h = mountUpdater(roster);

    h.updateObjects();

    // No dispatch → no reconciliation → no emoji node visited → no style
    // rewrite. This is the entire frame-budget contract.
    expect(h.setGameObjects).not.toHaveBeenCalled();
  });

  it("still advances the positions map on a movement-only frame", () => {
    const roster = [makeObject({ id: "a", y: 100, speed: 4 })];
    const h = mountUpdater(roster);

    h.updateObjects();

    const moved = h.positionsRef.current.get("a");
    expect(moved).toBeDefined();
    expect(moved?.y).toBeGreaterThan(100);
    expect(moved?.x).toBe(50);
  });

  it("dispatches a prune that drops the object which fell off screen", () => {
    const doomed = makeObject({ id: "doomed", y: 1059.5, speed: 50 });
    const safe = makeObject({ id: "safe", y: 100, speed: 1 });
    const h = mountUpdater([doomed, safe]);

    h.updateObjects();

    expect(h.setGameObjects).toHaveBeenCalledTimes(1);
    const result = applyUpdater(h.setGameObjects, [doomed, safe]);
    expect(result.map((o) => o.id)).toEqual(["safe"]);
    expect(h.positionsRef.current.has("doomed")).toBe(false);
  });

  it("reports a missed object to the tracker exactly once", async () => {
    const { eventTracker } = await import("../../../lib/event-tracker");
    const doomed = makeObject({ id: "doomed", y: 1059.5, speed: 50 });
    const h = mountUpdater([doomed]);

    h.updateObjects();
    const pruned = applyUpdater(h.setGameObjects, [doomed]);
    h.gameObjectsRef.current = pruned;
    h.updateObjects();

    expect(pruned).toEqual([]);
    expect(vi.mocked(eventTracker.trackEmojiLifecycle)).toHaveBeenCalledTimes(1);
  });

  it("does not dispatch when the roster is already empty", () => {
    const h = mountUpdater([]);

    h.updateObjects();

    expect(h.setGameObjects).not.toHaveBeenCalled();
  });
});
