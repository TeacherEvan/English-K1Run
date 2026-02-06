/**
 * Difficulty curve calculations for gameplay pacing.
 */

import type { DifficultyConfig } from "./engagement-types";

export const DEFAULT_DIFFICULTY: DifficultyConfig = {
  baseFallSpeed: 1.0,
  speedIncreasePerProgress: 0.03,
  maxSpeedMultiplier: 1.8,
  baseSpawnInterval: 1500,
  minSpawnInterval: 1000,
};

export const calculateDynamicSpeed = (
  progress: number,
  config: DifficultyConfig = DEFAULT_DIFFICULTY,
): number => {
  const progressFactor = Math.floor(progress / 10);
  const speedIncrease = progressFactor * config.speedIncreasePerProgress;
  const multiplier = config.baseFallSpeed + speedIncrease;

  return Math.min(multiplier, config.maxSpeedMultiplier);
};

export const calculateSpawnInterval = (
  progress: number,
  config: DifficultyConfig = DEFAULT_DIFFICULTY,
): number => {
  const progressFactor = progress / 100;
  const intervalReduction =
    (config.baseSpawnInterval - config.minSpawnInterval) * progressFactor * 0.3;

  return Math.max(
    config.minSpawnInterval,
    config.baseSpawnInterval - intervalReduction,
  );
};
