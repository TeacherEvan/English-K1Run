import { act, createElement, useEffect, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GAME_CATEGORIES } from "../../../lib/constants/game-categories";
import type { GameState } from "../../../types/game";
import { useInterLevelTransition } from "../game-effects/inter-level-transition";
import { createStartGame } from "../game-session-start";
import { handleProgressWin } from "../tap-handlers-object-win";

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

const baseState = (): GameState => ({
  progress: 100,
  currentTarget: "apple",
  targetEmoji: "🍎",
  level: 0,
  gameStarted: true,
  winner: false,
  phase: "playing",
  pendingLevel: null,
  countdownEndsAt: null,
  levelCompleteEndsAt: null,
  levelQueue: [0],
  levelQueueIndex: 0,
  targetsClearedThisLevel: 10,
  continuousCategoryClearCount: 0,
  targetChangeTime: Date.now(),
  streak: 0,
  lastMilestone: 0,
});

describe("inter-level transition flow", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.useFakeTimers();
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

  it("queues the selected level and starts with a countdown", () => {
    let state: GameState = {
      ...baseState(),
      gameStarted: false,
      phase: "idle",
    };
    const startGame = createStartGame({
      clampLevel: (level) => level,
      gameStateLevel: 0,
      continuousMode: false,
      generateRandomTarget: () => ({ name: "apple", emoji: "🍎" }),
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

    startGame(2);

    expect(state.phase).toBe("interLevelCountdown");
    expect(state.pendingLevel).toBe(2);
    expect(state.winner).toBe(false);
    expect(state.gameStarted).toBe(true);
    expect(state.levelQueue?.[0]).toBe(2);
    expect(state.levelQueue).toHaveLength(GAME_CATEGORIES.length);
  });

  it("enters levelComplete instead of winner when another queued level exists", () => {
    const prev = { ...baseState(), levelQueue: [0, 1], levelQueueIndex: 0 };
    const newState = { ...prev };

    handleProgressWin({
      prev,
      newState,
    });

    expect(newState.phase).toBe("levelComplete");
    expect(newState.pendingLevel).toBe(1);
    expect(newState.levelQueueIndex).toBe(1);
    expect(newState.winner).toBe(false);
    expect(newState.levelCompleteEndsAt).toBeTypeOf("number");
  });

  it("moves from popup to countdown to playing", () => {
    let latestState: GameState = {
      ...baseState(),
      phase: "levelComplete",
      pendingLevel: 1,
      levelQueue: [0, 1],
      levelQueueIndex: 1,
      levelCompleteEndsAt: Date.now() + 100,
    };
    const spawnImmediateTargets = vi.fn();

    const Harness = () => {
      const [gameState, setGameState] = useState<GameState>(latestState);
      useInterLevelTransition({
        gameState,
        continuousMode: false,
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
      vi.advanceTimersByTime(100);
    });
    expect(latestState.phase).toBe("interLevelCountdown");

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(latestState.phase).toBe("playing");
    expect(latestState.level).toBe(1);
    expect(latestState.currentTarget).toBe("banana");

    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(spawnImmediateTargets).toHaveBeenCalledTimes(1);
  });
});
