/**
 * Types for engagement, milestones, and difficulty tuning.
 */

export interface Milestone {
  /** Progress percentage threshold (0-100). */
  progress: number;
  /** Short celebration title. */
  title: string;
  /** Encouraging message. */
  message: string;
  /** Visual emoji for celebration. */
  emoji: string;
  /** Duration to display in milliseconds. */
  duration: number;
  /** Optional special effect. */
  effect?: "confetti" | "stars" | "rainbow" | "firework";
}

export interface PowerUp {
  /** Unique identifier for the power-up type. */
  type: "slow_time" | "double_points" | "clear_screen" | "bonus_target";
  /** Display name. */
  name: string;
  /** Emoji representation. */
  emoji: string;
  /** Duration of effect in milliseconds. */
  effectDuration: number;
  /** Description of what it does. */
  description: string;
  /** Rarity (affects spawn chance). */
  rarity: "common" | "uncommon" | "rare";
  /** Spawn weight (higher = more common). */
  spawnWeight: number;
}

export interface DifficultyConfig {
  /** Fall speed multiplier at 0% progress. */
  baseFallSpeed: number;
  /** Fall speed multiplier at 100% progress. */
  maxSpeedMultiplier: number;
  /** Spawn interval at start (ms). */
  baseSpawnInterval: number;
  /** Minimum spawn interval (ms). */
  minSpawnInterval: number;
}
