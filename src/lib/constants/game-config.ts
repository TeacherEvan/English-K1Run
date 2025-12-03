/**
 * Game configuration constants
 * Extracted from use-game-logic.ts for easier tuning
 */

import type { PlayerSide } from '../../types/game'

// Object spawning
export const MAX_ACTIVE_OBJECTS = 30
export const SPAWN_COUNT = 8
export const TARGET_GUARANTEE_COUNT = 2
export const MIN_DECOY_SLOTS = 2
export const EMOJI_SIZE = 60
export const MIN_VERTICAL_GAP = 40  // Reduced from 120 for faster object appearance
export const SPAWN_VERTICAL_GAP = 15  // Smaller gap for spawn stacking
export const HORIZONTAL_SEPARATION = 6
export const COLLISION_MIN_SEPARATION = 8
export const SPAWN_ABOVE_SCREEN = 200  // Pixels above screen top where objects spawn

// Worm spawning
export const WORM_INITIAL_COUNT = 5
export const WORM_PROGRESSIVE_SPAWN_INTERVAL = 3000
export const WORM_RECURRING_COUNT = 3
export const WORM_RECURRING_INTERVAL = 30000
export const WORM_SIZE = 60
export const WORM_BASE_SPEED = 1.5

// Lane boundaries (percentage-based) - Single player mode uses full width
export const LANE_BOUNDS: Record<PlayerSide, [number, number]> = {
    left: [5, 95],   // Full width for single player
    right: [5, 95]   // Same as left for single player mode
}

// Timing
export const ROTATION_THRESHOLD = 10000 // 10 seconds
export const FAIRY_TRANSFORM_DURATION = 10000 // 10 seconds
export const SPAWN_INTERVAL_MS = 1500 // Object spawn interval
export const FORCE_TARGET_SPAWN_MS = 6000 // Force target if not spawned
export const TARGET_CHANGE_TIMEOUT_MS = 10000 // Target auto-change timeout

// Scoring
export const PROGRESS_INCREMENT = 20 // Progress gained on correct tap
export const PROGRESS_PENALTY = 20 // Progress lost on incorrect tap
export const PROGRESS_MAX = 100 // Maximum progress to win

// Helper function
export const clamp = (value: number, min: number, max: number) =>
    Math.min(max, Math.max(min, value))
