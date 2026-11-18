import { describe, expect, it } from "vitest";

import {
  DEFAULT_DIFFICULTY,
  calculateDynamicSpeed,
  calculateSpawnInterval,
} from "../../../lib/constants/engagement-difficulty";
import { PROGRESS_MAX } from "../../../lib/constants/game-config";

describe("difficulty curve", () => {
  it("spawns at the configured base interval when the level starts", () => {
    expect(calculateSpawnInterval(0)).toBe(DEFAULT_DIFFICULTY.baseSpawnInterval);
  });

  it("reaches the configured minimum interval at 100% progress", () => {
    expect(calculateSpawnInterval(PROGRESS_MAX)).toBe(
      DEFAULT_DIFFICULTY.minSpawnInterval,
    );
  });

  it("never increases the interval as progress rises", () => {
    const samples = Array.from({ length: 101 }, (_, progress) =>
      calculateSpawnInterval(progress),
    );

    for (let i = 1; i < samples.length; i += 1) {
      expect(samples[i]).toBeLessThanOrEqual(samples[i - 1]);
    }
  });

  it("clamps out-of-range progress instead of drifting outside the config", () => {
    expect(calculateSpawnInterval(-50)).toBe(
      DEFAULT_DIFFICULTY.baseSpawnInterval,
    );
    expect(calculateSpawnInterval(10_000)).toBe(
      DEFAULT_DIFFICULTY.minSpawnInterval,
    );
  });

  it("keeps fall speed inside its configured bounds", () => {
    for (const progress of [0, 25, 50, 75, 100, 250, -10]) {
      const speed = calculateDynamicSpeed(progress);
      expect(speed).toBeGreaterThanOrEqual(DEFAULT_DIFFICULTY.baseFallSpeed);
      expect(speed).toBeLessThanOrEqual(DEFAULT_DIFFICULTY.maxSpeedMultiplier);
    }
  });

  it("makes the configured speed cap reachable by the end of a level", () => {
    // A cap that can never be reached is dead config: the ramp stops at 1.3x
    // while the config promises 1.8x, so the last third of a level is flat.
    expect(calculateDynamicSpeed(PROGRESS_MAX)).toBeCloseTo(
      DEFAULT_DIFFICULTY.maxSpeedMultiplier,
      5,
    );
  });
});
