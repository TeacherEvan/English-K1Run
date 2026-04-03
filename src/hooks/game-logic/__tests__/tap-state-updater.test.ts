import { beforeEach, describe, expect, it, vi } from "vitest";
import { GAME_CATEGORIES } from "../../../lib/constants/game-categories";
import type { GameState } from "../../../types/game";
import { updateStateOnTap } from "../tap-state-updater";

vi.mock("../../../lib/event-tracker", () => ({
  eventTracker: {
    trackGameStateChange: vi.fn(),
    trackTargetClearProgress: vi.fn(),
  },
}));

describe("updateStateOnTap", () => {
  const currentCategory = {
    name: GAME_CATEGORIES[0].name,
    items: GAME_CATEGORIES[0].items,
    requiresSequence: false,
  };

  let state: GameState;

  const baseState = (): GameState => ({
    progress: 0,
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
    targetsClearedThisLevel: 0,
    continuousCategoryClearCount: 0,
    targetChangeTime: Date.now(),
    streak: 0,
    lastMilestone: 0,
  });

  const makeDeps = () => ({
    gameState: state,
    currentCategory,
    reducedMotion: false,
    generateRandomTarget: () => ({ name: "apple", emoji: "🍎" }),
    spawnImmediateTargets: vi.fn(),
    continuousMode: false,
    continuousModeTargetCount: { current: 0 },
    continuousModeHighScore: null,
    continuousModeStartTime: null,
    setContinuousModeHighScore: vi.fn(),
    setContinuousModeStartTime: vi.fn(),
    refillTargetPool: vi.fn(),
    setGameState: (updater: GameState | ((prev: GameState) => GameState)) => {
      state = typeof updater === "function" ? updater(state) : updater;
    },
    setScreenShake: vi.fn(),
  });

  beforeEach(() => {
    state = baseState();
    vi.clearAllMocks();
  });

  it("requires 10 correct taps to win default mode", () => {
    const deps = makeDeps();

    for (let i = 0; i < 9; i += 1) {
      updateStateOnTap(true, deps);
    }

    expect(state.targetsClearedThisLevel).toBe(9);
    expect(state.winner).toBe(false);

    updateStateOnTap(true, deps);

    expect(state.targetsClearedThisLevel).toBe(10);
    expect(state.progress).toBe(100);
    expect(state.winner).toBe(true);
  });

  it("changes continuous-mode category after 7 completed clears", () => {
    const deps = makeDeps();
    deps.continuousMode = true;

    for (let i = 0; i < 6; i += 1) {
      state.progress = 95;
      updateStateOnTap(true, deps);
    }

    expect(state.level).toBe(0);
    expect(state.continuousCategoryClearCount).toBe(6);

    state.progress = 95;
    updateStateOnTap(true, deps);

    expect(state.level).toBe(1);
    expect(state.continuousCategoryClearCount).toBe(0);
  });

  it("penalizes incorrect taps by 5 and clamps at 0", () => {
    state.progress = 3;

    updateStateOnTap(false, makeDeps());

    expect(state.progress).toBe(0);
    expect(state.streak).toBe(0);
  });
});
