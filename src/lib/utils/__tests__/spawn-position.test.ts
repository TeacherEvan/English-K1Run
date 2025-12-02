/**
 * Unit Tests for Spawn Position Utility
 */

import { describe, it, expect } from 'vitest'
import { calculateSafeSpawnPosition } from '../spawn-position'
import type { GameObject } from '../../../types/game'

describe('calculateSafeSpawnPosition', () => {
  const mockGameObject = (x: number, y: number, id = 'test'): GameObject => ({
    id,
    type: 'apple',
    emoji: '🍎',
    x,
    y,
    speed: 1,
    size: 60,
    lane: 'left'
  })

  it('should return initial position when no objects exist', () => {
    const result = calculateSafeSpawnPosition({
      initialX: 50,
      initialY: 100,
      existingObjects: [],
      laneConstraints: { minX: 5, maxX: 95 }
    })

    expect(result).toEqual({ x: 50, y: 100 })
  })

  it('should adjust Y position to avoid vertical collision', () => {
    const existing = mockGameObject(50, 105)
    
    const result = calculateSafeSpawnPosition({
      initialX: 50,
      initialY: 100,
      existingObjects: [existing],
      laneConstraints: { minX: 5, maxX: 95 }
    })

    // Should push Y position above existing object
    expect(result.y).toBeLessThan(existing.y)
  })

  it('should adjust X position to avoid horizontal collision', () => {
    const existing = mockGameObject(50, 100)
    
    const result = calculateSafeSpawnPosition({
      initialX: 52, // Close to existing object
      initialY: 100,
      existingObjects: [existing],
      laneConstraints: { minX: 5, maxX: 95 }
    })

    // Should push X position away from existing object
    expect(Math.abs(result.x - existing.x)).toBeGreaterThanOrEqual(15)
  })

  it('should respect lane boundaries', () => {
    const existing = mockGameObject(10, 100)
    
    const result = calculateSafeSpawnPosition({
      initialX: 8, // Close to left boundary
      initialY: 100,
      existingObjects: [existing],
      laneConstraints: { minX: 5, maxX: 95 }
    })

    // Should clamp to minimum boundary
    expect(result.x).toBeGreaterThanOrEqual(5)
    expect(result.x).toBeLessThanOrEqual(95)
  })

  it('should handle multiple existing objects', () => {
    const existing = [
      mockGameObject(30, 100, 'obj1'),
      mockGameObject(50, 105, 'obj2'),
      mockGameObject(70, 110, 'obj3')
    ]
    
    const result = calculateSafeSpawnPosition({
      initialX: 50,
      initialY: 105,
      existingObjects: existing,
      laneConstraints: { minX: 5, maxX: 95 }
    })

    // Should find safe position avoiding all objects
    expect(result).toBeDefined()
    expect(result.x).toBeGreaterThanOrEqual(5)
    expect(result.x).toBeLessThanOrEqual(95)
  })

  it('should not modify position when far from existing objects', () => {
    const existing = mockGameObject(10, 10)
    
    const result = calculateSafeSpawnPosition({
      initialX: 80,
      initialY: 200,
      existingObjects: [existing],
      laneConstraints: { minX: 5, maxX: 95 }
    })

    // Should keep initial position when far away
    expect(result).toEqual({ x: 80, y: 200 })
  })
})
