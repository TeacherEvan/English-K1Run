/**
 * Game Configuration Constants
 * 
 * Central configuration for gameplay mechanics, spawning behavior, timing, and scoring.
 * Extracted from use-game-logic.ts for easier tuning and maintenance.
 * 
 * @module game-config
 * 
 * Architecture Notes:
 * - All values are tuned for 60fps gameplay on tablets
 * - Percentage-based positioning ensures responsive layouts
 * - Constants grouped by functional area for clarity
 * 
 * Performance Targets:
 * - 60fps animation frame rate
 * - Sub-100ms touch latency
 * - Max 30 concurrent objects on screen
 * 
 * @see {@link ../use-game-logic.ts} for implementation details
 */

import type { PlayerSide } from '../../types/game'

// ============================================================================
// OBJECT SPAWNING CONFIGURATION
// ============================================================================

/** Maximum number of game objects allowed on screen simultaneously (performance cap) */
export const MAX_ACTIVE_OBJECTS = 30

/** Number of objects spawned per spawn cycle (8 objects every 1.5s) */
export const SPAWN_COUNT = 8

/** 
 * Number of target emojis guaranteed to spawn per cycle
 * Ensures players always have target objects available to tap
 */
export const TARGET_GUARANTEE_COUNT = 2

/** Minimum number of decoy object slots per spawn (non-target emojis) */
export const MIN_DECOY_SLOTS = 2

/** Base emoji size in pixels (scaled by --object-scale CSS variable) */
export const EMOJI_SIZE = 60

/** 
 * Minimum vertical gap between objects in pixels
 * Reduced from 120 to 40 for faster object appearance rate
 */
export const MIN_VERTICAL_GAP = 40

/** Vertical gap between stacked spawned objects in pixels */
export const SPAWN_VERTICAL_GAP = 15

/** Minimum horizontal separation between objects in percentage units */
export const HORIZONTAL_SEPARATION = 6

/** Minimum separation distance for collision detection in percentage units */
export const COLLISION_MIN_SEPARATION = 8

/** Distance above screen top (in pixels) where objects initially spawn */
export const SPAWN_ABOVE_SCREEN = 200

// ============================================================================
// WORM DISTRACTOR CONFIGURATION
// ============================================================================

/** Initial number of worms spawned at game start (reduced by 50% for better gameplay balance) */
export const WORM_INITIAL_COUNT = 3

/** Interval for progressive worm spawning during gameplay (milliseconds) */
export const WORM_PROGRESSIVE_SPAWN_INTERVAL = 3000

/** Number of worms spawned in recurring intervals (reduced by 50% for better gameplay balance) */
export const WORM_RECURRING_COUNT = 2

/** Recurring worm spawn interval (every 30 seconds) */
export const WORM_RECURRING_INTERVAL = 30000

/** Worm size in pixels */
export const WORM_SIZE = 60

/** Base movement speed for worms (multiplied by speed scale) */
export const WORM_BASE_SPEED = 1.5

// ============================================================================
// LANE BOUNDARIES & POSITIONING
// ============================================================================

/** 
 * Lane boundaries in percentage units (0-100)
 * Single-player mode uses full width for both lanes
 * Format: [minX, maxX] where values are percentages of screen width
 */
export const LANE_BOUNDS: Record<PlayerSide, [number, number]> = {
    left: [5, 95],   // Full width (5% to 95%) for single player
    right: [5, 95]   // Same as left for single player mode
}

// ============================================================================
// TIMING CONFIGURATION
// ============================================================================

/** 
 * Emoji rotation threshold in milliseconds
 * Emojis not seen for this duration are prioritized for spawning
 */
export const ROTATION_THRESHOLD = 10000 // 10 seconds

/** Duration of fairy transformation animation when worms are tapped */
export const FAIRY_TRANSFORM_DURATION = 10000 // 10 seconds

/** Interval between object spawn cycles in milliseconds */
export const SPAWN_INTERVAL_MS = 1500

/** 
 * Force target spawn threshold
 * If target hasn't spawned naturally within this time, force spawn it
 */
export const FORCE_TARGET_SPAWN_MS = 6000

/** Automatic target change timeout (if not sequence mode) */
export const TARGET_CHANGE_TIMEOUT_MS = 10000

// ============================================================================
// SCORING & PROGRESSION
// ============================================================================

/** Progress increment per correct object tap (percentage points) */
export const PROGRESS_INCREMENT = 20

/** Progress penalty per incorrect object tap (percentage points) */
export const PROGRESS_PENALTY = 20

/** Maximum progress value to win the game (100%) */
export const PROGRESS_MAX = 100

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Clamps a numeric value within specified bounds
 * 
 * @param value - The value to clamp
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @returns Clamped value between min and max (inclusive)
 * 
 * @example
 * ```typescript
 * clamp(150, 0, 100) // Returns 100
 * clamp(-10, 0, 100) // Returns 0
 * clamp(50, 0, 100)  // Returns 50
 * ```
 */
export const clamp = (value: number, min: number, max: number): number =>
    Math.min(max, Math.max(min, value))

