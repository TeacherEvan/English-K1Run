/**
 * Game configuration constants
 * Extracted from use-game-logic.ts for easier tuning
 */

import type { PlayerSide } from '../../types/game'

// Object spawning
export const MAX_ACTIVE_OBJECTS = 30
export const SPAWN_COUNT = 8
export const TARGET_GUARANTEE_COUNT = 2
export const EMOJI_SIZE = 60
export const MIN_VERTICAL_GAP = 120
export const HORIZONTAL_SEPARATION = 6
export const COLLISION_MIN_SEPARATION = 8

// Worm spawning
export const WORM_INITIAL_COUNT = 5
export const WORM_PROGRESSIVE_SPAWN_INTERVAL = 3000
export const WORM_RECURRING_COUNT = 3
export const WORM_RECURRING_INTERVAL = 30000
export const WORM_SIZE = 60
export const WORM_BASE_SPEED = 1.5

// Lane boundaries (percentage-based)
export const LANE_BOUNDS: Record<PlayerSide, [number, number]> = {
    left: [10, 45],
    right: [55, 90]
}

// Timing
export const ROTATION_THRESHOLD = 10000 // 10 seconds
export const FAIRY_TRANSFORM_DURATION = 10000 // 10 seconds

// Helper function
export const clamp = (value: number, min: number, max: number) =>
    Math.min(max, Math.max(min, value))
