/**
 * Spawn Position Utility
 * Consolidates spawn position calculation logic to avoid code duplication
 */

import { clamp, MIN_VERTICAL_GAP, HORIZONTAL_SEPARATION } from '../constants/game-config'
import type { GameObject } from '../../types/game'

// Re-export for use in spawn logic
export { HORIZONTAL_SEPARATION } from '../constants/game-config'

export interface SpawnPositionParams {
  initialX: number
  initialY: number
  existingObjects: GameObject[]
  laneConstraints: { minX: number; maxX: number }
}

/**
 * Calculate safe spawn position avoiding collisions with existing objects
 * @param params - Spawn position parameters
 * @returns Safe spawn coordinates
 */
export function calculateSafeSpawnPosition(params: SpawnPositionParams): { x: number; y: number } {
  const { initialX, initialY, existingObjects, laneConstraints } = params
  let spawnX = initialX
  let spawnY = initialY

  // Early exit optimization: only check objects in spawn zone (y < 200)
  const nearbyObjects = existingObjects.filter(obj => obj.y < 200)
  
  for (const existing of nearbyObjects) {
    const verticalGap = Math.abs(existing.y - spawnY)
    const horizontalGap = Math.abs(existing.x - spawnX)

    // Adjust vertical position if too close
    // Math.max pushes spawn position toward less negative Y values (closer to visible screen area)
    // Example: max(-60, -30) = -30 (less negative, closer to screen top at y=0)
    if (verticalGap < MIN_VERTICAL_GAP) {
      spawnY = Math.max(spawnY, existing.y - MIN_VERTICAL_GAP)
    }

    // Adjust horizontal position if overlapping vertically and too close horizontally
    if (horizontalGap < HORIZONTAL_SEPARATION && verticalGap < MIN_VERTICAL_GAP * 1.2) {
      spawnX = clamp(
        spawnX < existing.x 
          ? existing.x - HORIZONTAL_SEPARATION 
          : existing.x + HORIZONTAL_SEPARATION,
        laneConstraints.minX,
        laneConstraints.maxX
      )
    }
  }

  return { x: spawnX, y: spawnY }
}
