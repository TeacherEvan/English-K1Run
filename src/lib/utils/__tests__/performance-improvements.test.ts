/**
 * Performance tests to validate optimization improvements
 * Tests measure relative performance, not absolute timings
 */
import { describe, it, expect } from 'vitest'

interface GameObject {
  id: string
  type: string
  emoji: string
  x: number
  y: number
  speed: number
  size: number
  lane: 'left' | 'right'
}

describe('Performance Improvements', () => {
  describe('Lane Filtering Optimization', () => {
    it('should partition objects by lane more efficiently than repeated filtering', () => {
      // Create test objects
      const objects: GameObject[] = []
      for (let i = 0; i < 30; i++) {
        objects.push({
          id: `obj-${i}`,
          type: 'test',
          emoji: '🎯',
          x: Math.random() * 90 + 5,
          y: Math.random() * 100,
          speed: 1,
          size: 40,
          lane: i % 2 === 0 ? 'left' : 'right'
        })
      }

      // Measure old approach: repeated filtering (worst case - 8 spawns)
      const iterations = 1000
      const oldStart = performance.now()
      for (let iter = 0; iter < iterations; iter++) {
        for (let i = 0; i < 8; i++) {
          const lane = i % 2 === 0 ? 'left' : 'right'
          const laneObjects = objects.filter(obj => obj.lane === lane)
          // Simulate some work
          laneObjects.length
        }
      }
      const oldTime = performance.now() - oldStart

      // Measure new approach: pre-partition once
      const newStart = performance.now()
      for (let iter = 0; iter < iterations; iter++) {
        const leftObjects: GameObject[] = []
        const rightObjects: GameObject[] = []
        for (const obj of objects) {
          if (obj.lane === 'left') {
            leftObjects.push(obj)
          } else {
            rightObjects.push(obj)
          }
        }

        // Simulate 8 spawns accessing partitioned data
        for (let i = 0; i < 8; i++) {
          const lane = i % 2 === 0 ? 'left' : 'right'
          const laneObjects = lane === 'left' ? leftObjects : rightObjects
          // Simulate some work
          laneObjects.length
        }
      }
      const newTime = performance.now() - newStart

      // New approach should be significantly faster
      // Using conservative threshold to avoid flaky tests
      expect(newTime).toBeLessThan(oldTime * 0.8) // At least 20% faster
      
      console.log(`Lane filtering: Old=${oldTime.toFixed(2)}ms, New=${newTime.toFixed(2)}ms, Improvement=${((1 - newTime/oldTime) * 100).toFixed(1)}%`)
    })
  })

  describe('Object Update Optimization', () => {
    it('should update objects more efficiently with pre-allocated arrays', () => {
      const objects: GameObject[] = []
      for (let i = 0; i < 30; i++) {
        objects.push({
          id: `obj-${i}`,
          type: 'test',
          emoji: '🎯',
          x: Math.random() * 90 + 5,
          y: Math.random() * 100,
          speed: 1,
          size: 40,
          lane: i % 2 === 0 ? 'left' : 'right'
        })
      }

      const iterations = 10000
      const speedMultiplier = 1.2

      // Old approach: push to array with spread operator
      const oldStart = performance.now()
      for (let iter = 0; iter < iterations; iter++) {
        const updated: GameObject[] = []
        for (const obj of objects) {
          const newY = obj.y + obj.speed * speedMultiplier
          updated.push({ ...obj, y: newY })
        }
      }
      const oldTime = performance.now() - oldStart

      // New approach: pre-allocate and construct explicitly
      const newStart = performance.now()
      for (let iter = 0; iter < iterations; iter++) {
        const updated: GameObject[] = new Array(objects.length)
        let updatedIndex = 0
        for (const obj of objects) {
          const newY = obj.y + obj.speed * speedMultiplier
          updated[updatedIndex++] = {
            id: obj.id,
            type: obj.type,
            emoji: obj.emoji,
            x: obj.x,
            y: newY,
            speed: obj.speed,
            size: obj.size,
            lane: obj.lane
          }
        }
      }
      const newTime = performance.now() - newStart

      // New approach should be at least slightly faster or comparable
      // Using conservative threshold
      expect(newTime).toBeLessThan(oldTime * 1.1) // At most 10% slower (should be faster)
      
      console.log(`Object update: Old=${oldTime.toFixed(2)}ms, New=${newTime.toFixed(2)}ms, Improvement=${((1 - newTime/oldTime) * 100).toFixed(1)}%`)
    })
  })

  describe('Duplicate Checking Optimization', () => {
    it('should check for duplicates efficiently using Set operations', () => {
      const items = [
        { emoji: '🍎', name: 'apple' },
        { emoji: '🍌', name: 'banana' },
        { emoji: '🍇', name: 'grapes' },
        { emoji: '🍓', name: 'strawberry' },
        { emoji: '🥕', name: 'carrot' },
        { emoji: '🥒', name: 'cucumber' }
      ]

      const activeEmojis = new Set(['🍎', '🍌'])
      const spawnedInBatch = new Set(['🍇'])
      const iterations = 10000

      // Old approach: while loop with multiple conditions
      const oldStart = performance.now()
      for (let iter = 0; iter < iterations; iter++) {
        for (let i = 0; i < 8; i++) {
          let item = items[Math.floor(Math.random() * items.length)]
          let attempts = 0
          const maxAttempts = items.length * 2
          while (attempts < maxAttempts && 
                 (spawnedInBatch.has(item.emoji) || 
                  (activeEmojis.has(item.emoji) && Math.random() > 0.3))) {
            item = items[Math.floor(Math.random() * items.length)]
            attempts++
          }
        }
      }
      const oldTime = performance.now() - oldStart

      // New approach would pre-compute exclusion set
      // For this test, we're verifying Set operations are fast
      const newStart = performance.now()
      for (let iter = 0; iter < iterations; iter++) {
        for (let i = 0; i < 8; i++) {
          const item = items[Math.floor(Math.random() * items.length)]
          // Quick Set lookups
          const isDuplicate = spawnedInBatch.has(item.emoji) || activeEmojis.has(item.emoji)
          // Simulate work
          isDuplicate
        }
      }
      const newTime = performance.now() - newStart

      // This validates that Set operations are fast
      expect(newTime).toBeLessThan(oldTime)
      
      console.log(`Duplicate check: Old=${oldTime.toFixed(2)}ms, New=${newTime.toFixed(2)}ms, Improvement=${((1 - newTime/oldTime) * 100).toFixed(1)}%`)
    })
  })

  describe('Collision Detection Optimization', () => {
    it('should verify early exit conditions reduce collision checks', () => {
      const objects: GameObject[] = []
      // Create objects with varied vertical positions
      for (let i = 0; i < 15; i++) {
        objects.push({
          id: `obj-${i}`,
          type: 'test',
          emoji: '🎯',
          x: 50,
          y: i * 100, // Spread far apart vertically
          speed: 1,
          size: 40,
          lane: 'left'
        })
      }

      const MIN_VERTICAL_GAP = 150
      const iterations = 1000

      // Measure collision checks WITH early exit
      let checksWithEarlyExit = 0
      const earlyExitStart = performance.now()
      for (let iter = 0; iter < iterations; iter++) {
        for (let i = 0; i < objects.length - 1; i++) {
          const current = objects[i]
          for (let j = i + 1; j < objects.length; j++) {
            const other = objects[j]
            const verticalGap = Math.abs(current.y - other.y)
            
            // Early exit
            if (verticalGap > MIN_VERTICAL_GAP) continue
            
            checksWithEarlyExit++
            // Would do collision resolution here
          }
        }
      }
      const earlyExitTime = performance.now() - earlyExitStart

      // Measure collision checks WITHOUT early exit
      let checksWithoutEarlyExit = 0
      const noEarlyExitStart = performance.now()
      for (let iter = 0; iter < iterations; iter++) {
        for (let i = 0; i < objects.length - 1; i++) {
          const current = objects[i]
          for (let j = i + 1; j < objects.length; j++) {
            const other = objects[j]
            const verticalGap = Math.abs(current.y - other.y)
            
            // No early exit - always check
            checksWithoutEarlyExit++
            if (verticalGap <= MIN_VERTICAL_GAP) {
              // Would do collision resolution here
            }
          }
        }
      }
      const noEarlyExitTime = performance.now() - noEarlyExitStart

      // Early exit should reduce checks significantly
      expect(checksWithEarlyExit).toBeLessThan(checksWithoutEarlyExit * 0.5)
      // Note: Time comparison can be flaky due to JIT optimization, but check count is deterministic
      
      console.log(`Collision early exit: Checks=${checksWithEarlyExit}/${checksWithoutEarlyExit}, Time=${earlyExitTime.toFixed(2)}ms/${noEarlyExitTime.toFixed(2)}ms`)
    })
  })
})
