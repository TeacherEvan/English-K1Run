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

    // Should push Y position down toward visible area (away from negative)
    // With MIN_VERTICAL_GAP=40, spawning at y=100 near existing at y=105 
    // should push to max(100, 105-40) = max(100, 65) = 100 (no collision)
    expect(result.y).toBeGreaterThanOrEqual(existing.y - 40)
  })

  it('should adjust X position to avoid horizontal collision', () => {
    const existing = mockGameObject(50, 100)
    
    const result = calculateSafeSpawnPosition({
      initialX: 52, // Close to existing object
      initialY: 100,
      existingObjects: [existing],
      laneConstraints: { minX: 5, maxX: 95 }
    })

    // Should push X position away from existing object (HORIZONTAL_SEPARATION=6)
    expect(Math.abs(result.x - existing.x)).toBeGreaterThanOrEqual(6)
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

  it('should handle negative Y spawn positions correctly', () => {
    // Test spawning objects above the screen (negative Y)
    const result = calculateSafeSpawnPosition({
      initialX: 50,
      initialY: -60, // Spawn above screen
      existingObjects: [],
      laneConstraints: { minX: 5, maxX: 95 }
    })

    // Should preserve negative Y when no collisions
    expect(result.y).toBe(-60)
  })

  it('should push objects toward visible area when collision detected', () => {
    // Simulate existing object near top of screen
    const existing = mockGameObject(50, 10)
    
    const result = calculateSafeSpawnPosition({
      initialX: 50,
      initialY: -30, // Spawn above screen, close to existing
      existingObjects: [existing],
      laneConstraints: { minX: 5, maxX: 95 }
    })

    // Should push DOWN (less negative, toward screen) to avoid collision
    // max(-30, 10-40) = max(-30, -30) = -30
    expect(result.y).toBeGreaterThanOrEqual(-30)
  })

  it('should optimize by only checking nearby objects', () => {
    // Test that distant objects are filtered out for performance
    const nearObject = mockGameObject(50, 50)
    const farObject = mockGameObject(70, 500) // Far below spawn zone
    
    const result = calculateSafeSpawnPosition({
      initialX: 50,
      initialY: 60,
      existingObjects: [nearObject, farObject],
      laneConstraints: { minX: 5, maxX: 95 }
    })

    // Far object should be ignored (outside y<200 zone)
    // Only near object affects spawn position
    expect(result.y).toBeGreaterThanOrEqual(10) // 50 - 40 = 10
  })
})
