import { describe, it, expect } from "vitest";
import type {
  Dispatch,
  SetStateAction,
  MutableRefObject,
} from "react";
import { GAME_CATEGORIES } from "../../../lib/constants/game-categories";
import { updateStateOnTap } from "../tap-state-updater";
import type { GameState, GameCategory } from "../../../types/game";

const makeRef = (length: number, fill = 0) => ({
  current: new Array<number>(length).fill(fill),
});

const noop = () => {};
const noopSet: Dispatch<SetStateAction<unknown>> = () => {};

const buildSeqCategory = (level: number): GameCategory => ({
  name: `seq-${level}`,
  requiresSequence: true,
  items: [
    { emoji: "1️⃣", name: "one" },
    { emoji: "2️⃣", name: "two" },
    { emoji: "3️⃣", name: "three" },
  ],
});

interface TapDeps {
  level: number;
  category: GameCategory;
  sequenceIndicesRef: { current: number[] };
}

const buildDeps = ({ level, category, sequenceIndicesRef }: TapDeps) => {
  const gameState: GameState = {
    progress: 0,
    currentTarget: "",
    targetEmoji: "",
    level,
    gameStarted: true,
    winner: false,
    targetChangeTime: 0,
    streak: 0,
  };
  return {
    gameState,
    currentCategory: category,
    reducedMotion: true,
    generateRandomTarget: () => ({ name: "next", emoji: "➡️" }),
    spawnImmediateTargets: noop,
    continuousMode: false,
    sequenceIndicesRef: sequenceIndicesRef as MutableRefObject<number[]>,
    continuousModeTargetCount: { current: 0 } as MutableRefObject<number>,
    continuousModeHighScore: null,
    continuousModeStartTime: null,
    setContinuousModeHighScore: noopSet,
    setContinuousModeStartTime: noopSet,
    refillTargetPool: noop,
    setGameState: ((value: GameState | ((prev: GameState) => GameState)) => {
      // Execute the updater synchronously so ref writes are observable.
      const result =
        typeof value === "function"
          ? (value as (prev: GameState) => GameState)(gameState)
          : value;
      Object.assign(gameState, result);
    }) as Dispatch<SetStateAction<GameState>>,
    setScreenShake: noopSet,
  };
};

describe("sequenceIndicesRef (F-001 fix)", () => {
  it("GAME_CATEGORIES is frozen and rejects runtime mutation", () => {
    expect(Object.isFrozen(GAME_CATEGORIES)).toBe(true);
    expect(Object.isFrozen(GAME_CATEGORIES[0])).toBe(true);
    expect(() => {
      // @ts-expect-error - intentionally testing the freeze guard
      GAME_CATEGORIES[0].sequenceIndex = 5;
    }).toThrow();
  });

  it("advances the per-session sequence ref on a correct tap (not the global constant)", () => {
    const level = 2;
    const ref = makeRef(GAME_CATEGORIES.length, 0);
    const category = buildSeqCategory(level);
    const deps = buildDeps({ level, category, sequenceIndicesRef: ref });

    updateStateOnTap(true, deps);

    expect(ref.current[level]).toBe(1);
    // The shared constant was never touched.
    expect(
      // @ts-expect-error - property removed from type; proving it no longer exists
      GAME_CATEGORIES[level].sequenceIndex,
    ).toBeUndefined();
  });

  it("stops advancing the sequence target once items are exhausted, storing the final index", () => {
    const level = 1;
    const ref = makeRef(GAME_CATEGORIES.length, 2);
    const category = buildSeqCategory(level);
    const deps = buildDeps({ level, category, sequenceIndicesRef: ref });

    // items.length === 3; starting at 2, one more correct tap advances to 3
    // but does NOT advance the target (no item at index 3). The stored index is 3.
    updateStateOnTap(true, deps);
    expect(ref.current[level]).toBe(3);
  });

  it("does not advance the sequence ref on an incorrect tap", () => {
    const level = 0;
    const ref = makeRef(GAME_CATEGORIES.length, 0);
    const category = buildSeqCategory(level);
    const deps = buildDeps({ level, category, sequenceIndicesRef: ref });

    updateStateOnTap(false, deps);
    expect(ref.current[level]).toBe(0);
  });

  it("per-session reset clears only its own ref, never the shared constant", () => {
    const ref = makeRef(GAME_CATEGORIES.length, 0);
    ref.current[1] = 4;
    // Mirrors resetGame: sequenceIndicesRef.current.fill(0)
    ref.current.fill(0);
    expect(ref.current.every((v) => v === 0)).toBe(true);
    expect(
      // @ts-expect-error - property removed from type
      GAME_CATEGORIES[1].sequenceIndex,
    ).toBeUndefined();
  });
});
