import { beforeEach, describe, expect, it, vi } from "vitest";

import type { GameState } from "../../../types/game";
import { createStartGame } from "../game-session-start";

vi.mock("../../../lib/event-tracker", () => ({
  eventTracker: {
    initializeEmojiTracking: vi.fn(),
    resetPerformanceMetrics: vi.fn(),
    startPerformanceMonitoring: vi.fn(),
    stopPerformanceMonitoring: vi.fn(),
    trackGameStateChange: vi.fn(),
    trackError: vi.fn(),
  },
}));

vi.mock("../../../lib/sound-manager", () => ({
  soundManager: { prefetchAudioKeys: vi.fn() },
}));

vi.mock("../../../lib/touch-handler", () => ({
  multiTouchHandler: { enable: vi.fn(), disable: vi.fn() },
}));

vi.mock("../worm-initialization", () => ({
  initializeWormSpawning: vi.fn(),
}));

describe("continuous mode session start", () => {
  let state: GameState;

  beforeEach(() => {
    state = {
      progress: 0,
      currentTarget: "apple",
      targetEmoji: "🍎",
      level: 0,
      gameStarted: false,
      winner: false,
      runMode: null,
      phase: "idle",
      pendingLevel: null,
      countdownEndsAt: null,
      levelCompleteEndsAt: null,
      levelQueue: [],
      levelQueueIndex: -1,
      targetsClearedThisLevel: 0,
      continuousCategoryClearCount: 0,
      continuousLevelEndsAt: null,
      continuousRunScore: 0,
      targetChangeTime: Date.now(),
      streak: 0,
      lastMilestone: 0,
    };
  });

  it("starts continuous mode immediately with a full-pass queue", () => {
    const startGame = createStartGame({
      clampLevel: (level) => level,
      gameStateLevel: 0,
      continuousMode: true,
      generateRandomTarget: () => ({ name: "banana", emoji: "🍌" }),
      spawnImmediateTargets: vi.fn(),
      lastEmojiAppearance: { current: new Map() },
      targetPool: { current: [] },
      progressiveSpawnTimeoutRefs: { current: [] },
      recurringSpawnIntervalRef: { current: undefined },
      wormSpeedMultiplier: { current: 1 },
      setGameObjects: vi.fn(),
      setWorms: vi.fn(),
      setFairyTransforms: vi.fn(),
      setScreenShake: vi.fn(),
      setGameState: (updater) => {
        state = typeof updater === "function" ? updater(state) : updater;
      },
    });

    startGame(1);

    expect(state.phase).toBe("playing");
    expect(state.runMode).toBe("continuous");
    expect(state.levelQueue).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 0]);
    expect(state.levelQueueIndex).toBe(0);
    expect(state.continuousLevelEndsAt).toBeTypeOf("number");
  });
});
