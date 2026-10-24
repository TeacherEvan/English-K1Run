/**
 * Difficulty curve calculations for gameplay pacing.
 *
 * Both curves are pure functions of progress in [0, PROGRESS_MAX] and are
 * clamped at both ends: out-of-range progress can never produce a speed below
 * the configured floor or a spawn interval above the configured base.
 *
 * Design intent: a level should have a visible arc. It starts calm, accelerates
 * continuously, and reaches exactly the configured endpoints at 100% — so the
 * config values mean what they say and tuning them actually changes the game.
 */

import { PROGRESS_MAX } from "./game-config";
import type { DifficultyConfig } from "./engagement-types";

export const DEFAULT_DIFFICULTY: DifficultyConfig = {
  baseFallSpeed: 1.0,
  /** End-of-level fall speed. Reached exactly at PROGRESS_MAX (see test). */
  maxSpeedMultiplier: 1.45,
  baseSpawnInterval: 1500,
  minSpawnInterval: 1000,
};

/** Progress as a 0..1 fraction, clamped so bad input cannot invert the curve. */
const progressFraction = (progress: number): number => {
  if (!Number.isFinite(progress)) return 0;
  return Math.min(1, Math.max(0, progress / PROGRESS_MAX));
};

/**
 * Falling speed multiplier for the current progress.
 *
 * Interpolates linearly from `baseFallSpeed` at 0% to `maxSpeedMultiplier` at
 * 100%, so the configured ceiling is always reachable.
 */
export const calculateDynamicSpeed = (
  progress: number,
  config: DifficultyConfig = DEFAULT_DIFFICULTY,
): number => {
  const t = progressFraction(progress);

  return (
    config.baseFallSpeed +
    (config.maxSpeedMultiplier - config.baseFallSpeed) * t
  );
};

/**
 * Spawn interval in milliseconds for the current progress.
 *
 * Interpolates linearly from `baseSpawnInterval` at 0% down to
 * `minSpawnInterval` at 100%. Monotonically non-increasing.
 */
export const calculateSpawnInterval = (
  progress: number,
  config: DifficultyConfig = DEFAULT_DIFFICULTY,
): number => {
  const t = progressFraction(progress);

  return (
    config.baseSpawnInterval -
    (config.baseSpawnInterval - config.minSpawnInterval) * t
  );
};
