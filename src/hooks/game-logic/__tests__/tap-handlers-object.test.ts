import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GameObject, GameState } from "../../../types/game";
import { createHandleObjectTap } from "../tap-handlers-object";

const trackerSpies = vi.hoisted(() => ({
  trackEmojiLifecycle: vi.fn(),
  trackObjectTap: vi.fn(),
  trackTargetClearProgress: vi.fn(),
  trackGameStateChange: vi.fn(),
  trackError: vi.fn(),
  trackWarning: vi.fn(),
}));

vi.mock("../../../lib/event-tracker", () => ({
  eventTracker: {
    trackEmojiLifecycle: trackerSpies.trackEmojiLifecycle,
    trackObjectTap: trackerSpies.trackObjectTap,
    trackTargetClearProgress: trackerSpies.trackTargetClearProgress,
    trackGameStateChange: trackerSpies.trackGameStateChange,
    trackError: trackerSpies.trackError,
    trackWarning: trackerSpies.trackWarning,
  },
}));

describe("createHandleObjectTap", () => {
  let objects: GameObject[];
  let state: GameState;

  beforeEach(() => {
    Object.values(trackerSpies).forEach((spy) => spy.mockClear());

    objects = [
      {
        id: "obj-1",
        type: "strawberry",
        emoji: "🍓",
        x: 50,
        y: 120,
        speed: 2,
        size: 60,
        lane: "left",
      },
    ];

    state = {
      progress: 90,
      currentTarget: "strawberry",
      targetEmoji: "🍓",
      level: 0,
      gameStarted: true,
      winner: false,
      phase: "playing",
      pendingLevel: null,
      countdownEndsAt: null,
      levelCompleteEndsAt: null,
      levelQueue: [0, 1],
      levelQueueIndex: 0,
      targetsClearedThisLevel: 9,
      continuousCategoryClearCount: 0,
      targetChangeTime: Date.now(),
      streak: 0,
      lastMilestone: 0,
    };
  });

  it("removes a correct target, records the clear, and enters levelComplete at threshold", () => {
    const handler = createHandleObjectTap({
      gameObjectsRef: { current: objects },
      gameState: state,
      currentCategory: {
        name: "Fruits & Vegetables",
        items: [{ emoji: "🍓", name: "strawberry" }],
        requiresSequence: false,
      },
      reducedMotion: false,
      generateRandomTarget: () => ({ name: "banana", emoji: "🍌" }),
      spawnImmediateTargets: vi.fn(),
      continuousMode: false,
      refillTargetPool: vi.fn(),
      setGameState: (updater) => {
        state = typeof updater === "function" ? updater(state) : updater;
      },
      setScreenShake: vi.fn(),
      setGameObjects: (updater) => {
        objects = typeof updater === "function" ? updater(objects) : updater;
      },
    });

    handler("obj-1", "left");

    expect(objects).toHaveLength(0);
    expect(trackerSpies.trackEmojiLifecycle).toHaveBeenCalledWith(
      expect.objectContaining({
        objectId: "obj-1",
        phase: "removed",
        data: expect.objectContaining({ reason: "correct-target-cleared" }),
      }),
    );
    expect(trackerSpies.trackTargetClearProgress).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 0,
        clearsThisLevel: 10,
        threshold: 10,
      }),
    );
    expect(state.phase).toBe("levelComplete");
  });
});
