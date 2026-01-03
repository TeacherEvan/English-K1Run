/**
 * Engagement System - Dynamic difficulty and reward mechanics
 *
 * Provides excitement curves, milestone celebrations, and power-up definitions
 * to enhance player engagement and create memorable gameplay moments.
 *
 * @module engagement-system
 */

/**
 * Milestone celebration triggered at progress thresholds
 */
export interface Milestone {
  /** Progress percentage threshold (0-100) */
  progress: number;
  /** Short celebration title */
  title: string;
  /** Encouraging message */
  message: string;
  /** Visual emoji for celebration */
  emoji: string;
  /** Duration to display in milliseconds */
  duration: number;
  /** Optional special effect */
  effect?: "confetti" | "stars" | "rainbow" | "firework";
}

/**
 * Power-up object that can spawn during gameplay
 */
export interface PowerUp {
  /** Unique identifier for the power-up type */
  type: "slow_time" | "double_points" | "clear_screen" | "bonus_target";
  /** Display name */
  name: string;
  /** Emoji representation */
  emoji: string;
  /** Duration of effect in milliseconds */
  effectDuration: number;
  /** Description of what it does */
  description: string;
  /** Rarity (affects spawn chance) */
  rarity: "common" | "uncommon" | "rare";
  /** Spawn weight (higher = more common) */
  spawnWeight: number;
}

/**
 * Difficulty scaling configuration
 */
export interface DifficultyConfig {
  /** Base fall speed multiplier */
  baseFallSpeed: number;
  /** Speed increase per 10% progress */
  speedIncreasePerProgress: number;
  /** Maximum speed multiplier cap */
  maxSpeedMultiplier: number;
  /** Spawn interval at start (ms) */
  baseSpawnInterval: number;
  /** Minimum spawn interval (ms) */
  minSpawnInterval: number;
}

/**
 * Progress milestones for celebration moments
 * Triggers special feedback at key progress thresholds
 */
export const PROGRESS_MILESTONES: Milestone[] = [
  {
    progress: 25,
    title: "Great Start!",
    message: "Quarter of the way there!",
    emoji: "🌱",
    duration: 2000,
    effect: "stars",
  },
  {
    progress: 50,
    title: "Halfway Hero!",
    message: "You're doing amazing!",
    emoji: "⚡",
    duration: 2500,
    effect: "confetti",
  },
  {
    progress: 75,
    title: "Almost There!",
    message: "The finish line is in sight!",
    emoji: "🚀",
    duration: 2500,
    effect: "rainbow",
  },
  {
    progress: 100,
    title: "CHAMPION!",
    message: "You did it! Amazing work!",
    emoji: "🏆",
    duration: 4000,
    effect: "firework",
  },
];

/**
 * Power-up definitions for special game objects
 * These add variety and excitement to gameplay
 */
export const POWER_UPS: PowerUp[] = [
  {
    type: "slow_time",
    name: "Time Freeze",
    emoji: "❄️",
    effectDuration: 5000,
    description: "Slows all falling objects for 5 seconds",
    rarity: "uncommon",
    spawnWeight: 15,
  },
  {
    type: "double_points",
    name: "Star Power",
    emoji: "⭐",
    effectDuration: 8000,
    description: "Double points for 8 seconds",
    rarity: "uncommon",
    spawnWeight: 20,
  },
  {
    type: "bonus_target",
    name: "Golden Target",
    emoji: "🌟",
    effectDuration: 0, // Instant effect
    description: "Instant +30 progress when tapped!",
    rarity: "rare",
    spawnWeight: 5,
  },
];

/**
 * Default difficulty configuration
 * Creates an exciting difficulty curve that escalates as player progresses
 */
export const DEFAULT_DIFFICULTY: DifficultyConfig = {
  baseFallSpeed: 1.0,
  speedIncreasePerProgress: 0.03, // 3% speed increase per 10% progress
  maxSpeedMultiplier: 1.8, // Cap at 80% faster than base
  baseSpawnInterval: 1500, // 1.5 seconds
  minSpawnInterval: 1000, // Don't go below 1 second
};

/**
 * Calculate dynamic fall speed based on current progress
 * Creates excitement curve where game gets progressively faster
 *
 * @param progress - Current progress percentage (0-100)
 * @param config - Difficulty configuration
 * @returns Speed multiplier to apply to base fall speed
 */
export const calculateDynamicSpeed = (
  progress: number,
  config: DifficultyConfig = DEFAULT_DIFFICULTY
): number => {
  // Calculate progress-based speed increase
  const progressFactor = Math.floor(progress / 10); // 0-10 based on progress
  const speedIncrease = progressFactor * config.speedIncreasePerProgress;

  // Apply increase with cap
  const multiplier = config.baseFallSpeed + speedIncrease;
  return Math.min(multiplier, config.maxSpeedMultiplier);
};

/**
 * Calculate spawn interval based on progress
 * Spawns get slightly faster as game progresses for excitement
 *
 * @param progress - Current progress percentage (0-100)
 * @param config - Difficulty configuration
 * @returns Spawn interval in milliseconds
 */
export const calculateSpawnInterval = (
  progress: number,
  config: DifficultyConfig = DEFAULT_DIFFICULTY
): number => {
  // Reduce spawn interval as progress increases (more objects = more excitement)
  const progressFactor = progress / 100;
  const intervalReduction =
    (config.baseSpawnInterval - config.minSpawnInterval) * progressFactor * 0.3;

  return Math.max(
    config.minSpawnInterval,
    config.baseSpawnInterval - intervalReduction
  );
};

/**
 * Check if a milestone should be triggered
 *
 * @param previousProgress - Progress before update
 * @param currentProgress - Progress after update
 * @returns Milestone to trigger, or undefined if none
 */
export const checkMilestone = (
  previousProgress: number,
  currentProgress: number
): Milestone | undefined => {
  return PROGRESS_MILESTONES.find(
    (milestone) =>
      previousProgress < milestone.progress &&
      currentProgress >= milestone.progress
  );
};

/**
 * Determine if a power-up should spawn based on random chance
 *
 * @param spawnChance - Base chance (0-100) for any power-up to spawn
 * @returns Power-up to spawn, or undefined if none
 */
export const rollPowerUpSpawn = (
  spawnChance: number = 3
): PowerUp | undefined => {
  // First, check if we should spawn any power-up at all
  if (Math.random() * 100 > spawnChance) {
    return undefined;
  }

  // Calculate total weight
  const totalWeight = POWER_UPS.reduce((sum, pu) => sum + pu.spawnWeight, 0);

  // Roll for which power-up
  let roll = Math.random() * totalWeight;
  for (const powerUp of POWER_UPS) {
    roll -= powerUp.spawnWeight;
    if (roll <= 0) {
      return powerUp;
    }
  }

  return POWER_UPS[0]; // Fallback to first power-up
};

/**
 * Near-miss feedback messages
 * Shown when player taps an object close to but not matching the target
 */
export const NEAR_MISS_MESSAGES = [
  { message: "So close!", emoji: "💨" },
  { message: "Almost!", emoji: "🎯" },
  { message: "Try again!", emoji: "💪" },
  { message: "Keep looking!", emoji: "👀" },
];

/**
 * Get a random near-miss message
 */
export const getRandomNearMissMessage = () => {
  return NEAR_MISS_MESSAGES[
    Math.floor(Math.random() * NEAR_MISS_MESSAGES.length)
  ];
};
