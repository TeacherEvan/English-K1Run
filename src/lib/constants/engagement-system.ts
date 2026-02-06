/**
 * Engagement system entry point.
 */

export {
  DEFAULT_DIFFICULTY,
  calculateDynamicSpeed,
  calculateSpawnInterval,
} from "./engagement-difficulty";
export {
  NEAR_MISS_MESSAGES,
  PROGRESS_MILESTONES,
  getRandomNearMissMessage,
} from "./engagement-milestones";
export { POWER_UPS, rollPowerUpSpawn } from "./engagement-powerups";
export type { DifficultyConfig, Milestone, PowerUp } from "./engagement-types";
