/**
 * Tests for performance profiler utilities
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { 
  performanceProfiler,
  measureExecutionTime
} from '../performance-profiler'

describe('PerformanceProfiler', () => {
  beforeEach(() => {
    performanceProfiler.clear()
    performanceProfiler.configure({
      enabled: true,
      maxMeasurements: 100,
      slowRenderThreshold: 16.67,
      enableLogging: false
    })
  })

  describe('recordMeasurement', () => {
    it('should record a measurement', () => {
      performanceProfiler.recordMeasurement(
        'TestComponent',
        'mount',
        10.5,
        12.0,
        0,
        10.5
      )

      const measurements = performanceProfiler.getMeasurements()
      expect(measurements).toHaveLength(1)
      expect(measurements[0].id).toBe('TestComponent')
      expect(measurements[0].phase).toBe('mount')
      expect(measurements[0].actualDuration).toBe(10.5)
    })

    it('should respect maxMeasurements limit', () => {
      performanceProfiler.configure({ maxMeasurements: 5 })

      // Record 10 measurements
      for (let i = 0; i < 10; i++) {
        performanceProfiler.recordMeasurement(
          `Component${i}`,
          'update',
          5,
          5,
          0,
          5
        )
      }

      const measurements = performanceProfiler.getMeasurements()
      expect(measurements).toHaveLength(5)
      // Should keep the latest 5
      expect(measurements[0].id).toBe('Component5')
    })
  })

  describe('getSummary', () => {
    it('should provide comprehensive summary statistics', () => {
      performanceProfiler.recordMeasurement('ComponentA', 'mount', 10, 10, 0, 10)
      performanceProfiler.recordMeasurement('ComponentB', 'mount', 20, 20, 0, 20)

      const summary = performanceProfiler.getSummary()
      
      expect(summary.totalMeasurements).toBe(2)
      expect(summary.componentsTracked).toHaveLength(2)
    })
  })
})

describe('measureExecutionTime', () => {
  it('should measure synchronous function execution time', () => {
    const result = measureExecutionTime('test', () => {
      let sum = 0
      for (let i = 0; i < 1000; i++) {
        sum += i
      }
      return sum
    })

    expect(result).toBe(499500) // Sum of 0..999
  })
})
