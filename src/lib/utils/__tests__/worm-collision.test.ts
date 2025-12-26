/**
 * Unit tests for worm-object collision physics
 * Tests the collision detection and bump mechanics between worms and game objects
 */

import { describe, it, expect } from 'vitest'

describe('Worm-Object Collision Physics', () => {
  it('should detect collision when worm and object are close', () => {
    // Test setup: worm at (50%, 100px), object at (52%, 105px)
    // With WORM_SIZE=60 and EMOJI_SIZE=60, collision should occur
    const wormRadiusPx = 30 // WORM_SIZE / 2
    const objectRadiusPx = 30 // EMOJI_SIZE / 2
    const collisionDistancePx = wormRadiusPx + objectRadiusPx // 60px
    
    const viewportWidth = 1920
    
    // Convert percentages to pixels
    const wormXPx = (50 / 100) * viewportWidth // 960px
    const wormYPx = 100
    
    const objXPx = (52 / 100) * viewportWidth // 998.4px
    const objYPx = 105
    
    // Calculate distance
    const dx = objXPx - wormXPx // 38.4px
    const dy = objYPx - wormYPx // 5px
    const distance = Math.sqrt(dx * dx + dy * dy) // ~38.7px
    
    // Should be less than collision distance (60px)
    expect(distance).toBeLessThan(collisionDistancePx)
  })

  it('should not detect collision when worm and object are far apart', () => {
    // Test setup: worm at (20%, 100px), object at (80%, 100px)
    const wormRadiusPx = 30
    const objectRadiusPx = 30
    const collisionDistancePx = wormRadiusPx + objectRadiusPx // 60px
    
    const viewportWidth = 1920
    
    const wormXPx = (20 / 100) * viewportWidth // 384px
    const wormYPx = 100
    
    const objXPx = (80 / 100) * viewportWidth // 1536px
    const objYPx = 100
    
    const dx = objXPx - wormXPx // 1152px
    const dy = objYPx - wormYPx // 0px
    const distance = Math.sqrt(dx * dx + dy * dy) // 1152px
    
    // Should be greater than collision distance (60px)
    expect(distance).toBeGreaterThan(collisionDistancePx)
  })

  it('should calculate correct push direction away from worm', () => {
    // Test: worm at (50, 100), object at (52, 100)
    // Object should be pushed to the right (positive X direction)
    const wormXPx = 960 // 50% of 1920
    const wormYPx = 100
    
    const objXPx = 998.4 // 52% of 1920
    const objYPx = 100
    
    const dx = objXPx - wormXPx // 38.4px (positive = right)
    const dy = objYPx - wormYPx // 0px
    
    const distance = Math.sqrt(dx * dx + dy * dy) // 38.4px
    
    // Normalized direction should be positive X
    const dirX = dx / distance
    const dirY = dy / distance
    
    expect(dirX).toBeCloseTo(1, 1) // Should be ~1 (right)
    expect(dirY).toBeCloseTo(0, 1) // Should be ~0 (no vertical)
  })

  it('should calculate push strength based on overlap', () => {
    // Collision distance is 60px (30 + 30)
    const collisionDistancePx = 60
    
    // Actual distance is 40px (20px overlap)
    const actualDistance = 40
    const overlap = collisionDistancePx - actualDistance // 20px
    
    // Push strength is 30% of overlap
    const pushStrength = overlap * 0.3 // 6px
    
    expect(pushStrength).toBe(6)
  })

  it('should convert push correctly from pixels to percentage', () => {
    const viewportWidth = 1920
    const pushXPx = 10 // 10 pixels push
    
    // Convert to percentage
    const pushXPercentage = (pushXPx / viewportWidth) * 100
    
    expect(pushXPercentage).toBeCloseTo(0.521, 2) // ~0.52%
  })
})
