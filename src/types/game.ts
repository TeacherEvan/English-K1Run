/**
 * Core game type definitions
 * Extracted from use-game-logic.ts for better code organization
 */

export type PlayerSide = "left" | "right";

export interface GameObject {
  id: string;
  type: string;
  emoji: string;
  x: number;
  y: number;
  speed: number;
  size: number;
  lane: PlayerSide;
  /** Optional: marks this as a power-up object */
  isPowerUp?: boolean;
  /** Optional: type of power-up if isPowerUp is true */
  powerUpType?: "slow_time" | "double_points" | "bonus_target";
}

export interface GameState {
  progress: number;
  currentTarget: string;
  targetEmoji: string;
  level: number;
  gameStarted: boolean;
  winner: boolean;
  targetChangeTime: number;
  streak: number;
  /** Current point multiplier from combo system */
  multiplier?: number;
  /** Active power-up effects */
  activePowerUps?: ActivePowerUp[];
  /** Last milestone reached (for preventing re-trigger) */
  lastMilestone?: number;
}

export interface ActivePowerUp {
  type: "slow_time" | "double_points" | "bonus_target";
  expiresAt: number;
}

export interface GameCategory {
  name: string;
  items: GameCategoryItem[];
  requiresSequence?: boolean;
  sequenceIndex?: number;
}

export interface GameCategoryItem {
  emoji: string;
  name: string;
}

export interface ComboCelebration {
  id: number;
  streak: number;
  title: string;
  description: string;
  /** Emoji for enhanced celebration display */
  emoji?: string;
  /** Special visual effect type */
  specialEffect?: "sparkle" | "rainbow" | "firework" | "golden";
}

export interface WormObject {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  alive: boolean;
  angle: number;
  wigglePhase: number;
  lane: PlayerSide;
}

export interface FairyTransformObject {
  id: string;
  x: number;
  y: number;
  createdAt: number;
  lane: PlayerSide;
}

export interface Achievement {
  id: number;
  type: "correct" | "worm" | "milestone" | "powerup";
  message: string;
  emoji?: string;
  x: number;
  y: number;
  playerSide: PlayerSide;
}

export interface UseGameLogicOptions {
  fallSpeedMultiplier?: number;
  continuousMode?: boolean;
}

/**
 * Milestone event data for tracking progress celebrations
 */
export interface MilestoneEvent {
  progress: number;
  title: string;
  message: string;
  emoji: string;
  triggeredAt: number;
}
