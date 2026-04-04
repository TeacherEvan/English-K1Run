import { act, createElement, useEffect, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CONTINUOUS_MODE_LEVEL_DURATION_MS } from "../../../lib/constants/game-config";
import type { GameState } from "../../../types/game";
import { useContinuousModeRotation } from "../game-effects/continuous-mode-rotation";

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

vi.mock("../worm-initialization", () => ({
  initializeWormSpawning: vi.fn(),
}));

const baseState = (): GameState => ({
  progress: 0,
  currentTarget: "apple",
  targetEmoji: "🍎",
  level: 0,
  gameStarted: true,
  winner: false,
  runMode: "continuous",
  phase: "playing",
  pendingLevel: null,
  countdownEndsAt: null,
  levelCompleteEndsAt: null,
  levelQueue: [0, 1],
  levelQueueIndex: 0,
  targetsClearedThisLevel: 0,
  continuousCategoryClearCount: 0,
  continuousLevelEndsAt: Date.now() + CONTINUOUS_MODE_LEVEL_DURATION_MS,
  continuousRunScore: 3,
  targetChangeTime: Date.now(),
  streak: 0,
  lastMilestone: 0,
});

describe("continuous mode rotation", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("advances to the next queued level after 15 seconds", () => {
    let latestState: GameState = baseState();
    const spawnImmediateTargets = vi.fn();

    const Harness = () => {
      const [gameState, setGameState] = useState<GameState>(latestState);
      useContinuousModeRotation({
        gameState,
        continuousMode: true,
        continuousModeHighScore: 2,
        setContinuousModeHighScore: vi.fn(),
        generateRandomTarget: () => ({ name: "banana", emoji: "🍌" }),
        spawnImmediateTargets,
        lastEmojiAppearance: { current: new Map() },
        targetPool: { current: [] },
        progressiveSpawnTimeoutRefs: { current: [] },
        recurringSpawnIntervalRef: { current: undefined },
        wormSpeedMultiplier: { current: 1 },
        setGameObjects: vi.fn(),
        setWorms: vi.fn(),
        setFairyTransforms: vi.fn(),
        setScreenShake: vi.fn(),
        setGameState,
      });

      useEffect(() => {
        latestState = gameState;
      }, [gameState]);

      return null;
    };

    act(() => {
      root.render(createElement(Harness));
    });

    act(() => {
      vi.advanceTimersByTime(CONTINUOUS_MODE_LEVEL_DURATION_MS);
    });

    expect(latestState.phase).toBe("playing");
    expect(latestState.level).toBe(1);
    expect(latestState.levelQueueIndex).toBe(1);
    expect(latestState.countdownEndsAt).toBeNull();
    expect(latestState.levelCompleteEndsAt).toBeNull();
  });

  it("finishes after one full pass and persists the best total", () => {
    let latestState: GameState = {
      ...baseState(),
      level: 1,
      levelQueueIndex: 1,
      continuousRunScore: 9,
    };
    const setContinuousModeHighScore = vi.fn();

    const Harness = () => {
      const [gameState, setGameState] = useState<GameState>(latestState);
      useContinuousModeRotation({
        gameState,
        continuousMode: true,
        continuousModeHighScore: 4,
        setContinuousModeHighScore,
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
        setGameState,
      });

      useEffect(() => {
        latestState = gameState;
      }, [gameState]);

      return null;
    };

    act(() => {
      root.render(createElement(Harness));
    });

    act(() => {
      vi.advanceTimersByTime(CONTINUOUS_MODE_LEVEL_DURATION_MS);
    });

    expect(latestState.phase).toBe("runComplete");
    expect(latestState.runMode).toBe("continuous");
    expect(latestState.winner).toBe(true);
    expect(localStorage.getItem("continuousModeBestTargetTotal")).toBe("9");
    expect(setContinuousModeHighScore).toHaveBeenCalledWith(9);
  });
});
