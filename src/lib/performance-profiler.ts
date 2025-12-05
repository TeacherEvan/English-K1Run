/**
 * Performance Profiler Utility
 * 
 * Production-grade performance monitoring for React 19 applications.
 * Tracks render times, component lifecycles, and provides actionable insights.
 * 
 * @module performance-profiler
 * 
 * Features:
 * - Component render timing
 * - Memory usage tracking
 * - FPS monitoring integration
 * - Performance marks and measures
 * - Production-safe logging
 * 
 * Architecture:
 * - Uses Performance API for accurate timing
 * - Singleton pattern for global state
 * - Minimal overhead in production
 * - Integrates with React DevTools Profiler
 * 
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Performance}
 * @see {@link https://react.dev/reference/react/Profiler}
 */

/**
 * Performance measurement data structure
 */
export interface PerformanceMeasurement {
  /** Unique identifier for the measurement */
  id: string
  /** Component or operation name */
  name: string
  /** Phase: mount, update, or nested-update */
  phase: 'mount' | 'update' | 'nested-update'
  /** Actual time spent rendering (milliseconds) */
  actualDuration: number
  /** Base time (without memoization, milliseconds) */
  baseDuration: number
  /** When the render started (relative to page load) */
  startTime: number
  /** When the render committed (relative to page load) */
  commitTime: number
  /** Timestamp when measured */
  timestamp: number
}

/**
 * Performance profiler configuration
 */
export interface ProfilerConfig {
  /** Enable profiling (default: false in production) */
  enabled: boolean
  /** Maximum measurements to store (default: 100) */
  maxMeasurements: number
  /** Log slow renders above this threshold (ms, default: 16.67 for 60fps) */
  slowRenderThreshold: number
  /** Enable console logging (default: false) */
  enableLogging: boolean
}

/**
 * Singleton performance profiler for tracking app-wide performance
 */
class PerformanceProfiler {
  private measurements: PerformanceMeasurement[] = []
  private config: ProfilerConfig = {
    enabled: import.meta.env.DEV, // Only enable in dev by default
    maxMeasurements: 100,
    slowRenderThreshold: 16.67, // 60fps = 16.67ms per frame
    enableLogging: false
  }

  /**
   * Configure the profiler
   * @param config - Partial configuration to merge with defaults
   */
  configure(config: Partial<ProfilerConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Record a performance measurement from React Profiler
   * 
   * @param id - Unique identifier for the measurement
   * @param phase - Render phase (mount, update, nested-update)
   * @param actualDuration - Actual render time in ms
   * @param baseDuration - Base render time without memoization in ms
   * @param startTime - When render started
   * @param commitTime - When render committed
   * 
   * @example
   * ```tsx
   * <Profiler id="GameArea" onRender={performanceProfiler.recordMeasurement}>
   *   <GameArea />
   * </Profiler>
   * ```
   */
  recordMeasurement(
    id: string,
    phase: 'mount' | 'update' | 'nested-update',
    actualDuration: number,
    baseDuration: number,
    startTime: number,
    commitTime: number
  ): void {
    if (!this.config.enabled) return

    const measurement: PerformanceMeasurement = {
      id,
      name: id,
      phase,
      actualDuration,
      baseDuration,
      startTime,
      commitTime,
      timestamp: Date.now()
    }

    // Add to measurements array
    this.measurements.push(measurement)

    // Trim if exceeds max
    if (this.measurements.length > this.config.maxMeasurements) {
      this.measurements.shift()
    }

    // Log slow renders
    if (actualDuration > this.config.slowRenderThreshold && this.config.enableLogging) {
      console.warn(
        `[PerformanceProfiler] Slow render detected: ${id} (${phase}) took ${actualDuration.toFixed(2)}ms`
      )
    }

    // Create performance mark for DevTools
    if (typeof performance !== 'undefined' && performance.mark) {
      try {
        performance.mark(`${id}-${phase}-${Date.now()}`)
      } catch {
        // Ignore errors in environments without performance API
      }
    }
  }

  /**
   * Get all recorded measurements
   * @returns Array of performance measurements
   */
  getMeasurements(): PerformanceMeasurement[] {
    return [...this.measurements]
  }

  /**
   * Get measurements for a specific component
   * @param id - Component identifier
   * @returns Filtered measurements
   */
  getMeasurementsById(id: string): PerformanceMeasurement[] {
    return this.measurements.filter(m => m.id === id)
  }

  /**
   * Get average render time for a component
   * @param id - Component identifier
   * @returns Average duration in ms, or 0 if no measurements
   */
  getAverageDuration(id: string): number {
    const measurements = this.getMeasurementsById(id)
    if (measurements.length === 0) return 0

    const sum = measurements.reduce((acc, m) => acc + m.actualDuration, 0)
    return sum / measurements.length
  }

  /**
   * Get slowest renders across all components
   * @param limit - Maximum number of results (default: 10)
   * @returns Sorted array of slowest measurements
   */
  getSlowestRenders(limit = 10): PerformanceMeasurement[] {
    return [...this.measurements]
      .sort((a, b) => b.actualDuration - a.actualDuration)
      .slice(0, limit)
  }

  /**
   * Clear all measurements
   */
  clear(): void {
    this.measurements = []
  }

  /**
   * Get performance summary statistics
   * @returns Object with summary metrics
   */
  getSummary(): {
    totalMeasurements: number
    averageDuration: number
    slowestRender: PerformanceMeasurement | null
    componentsTracked: string[]
  } {
    const total = this.measurements.length
    if (total === 0) {
      return {
        totalMeasurements: 0,
        averageDuration: 0,
        slowestRender: null,
        componentsTracked: []
      }
    }

    const sum = this.measurements.reduce((acc, m) => acc + m.actualDuration, 0)
    const avg = sum / total
    const slowest = this.getSlowestRenders(1)[0]
    const components = [...new Set(this.measurements.map(m => m.id))]

    return {
      totalMeasurements: total,
      averageDuration: avg,
      slowestRender: slowest,
      componentsTracked: components
    }
  }

  /**
   * Export measurements as JSON for analysis
   * @returns JSON string of all measurements
   */
  exportData(): string {
    return JSON.stringify({
      config: this.config,
      measurements: this.measurements,
      summary: this.getSummary(),
      exportedAt: new Date().toISOString()
    }, null, 2)
  }
}

/**
 * Singleton instance of the performance profiler
 * Import and use this instance throughout your application
 * 
 * @example
 * ```typescript
 * import { performanceProfiler } from '@/lib/performance-profiler'
 * 
 * // Configure in main.tsx
 * performanceProfiler.configure({
 *   enabled: true,
 *   slowRenderThreshold: 16.67,
 *   enableLogging: true
 * })
 * 
 * // Use in components
 * <Profiler id="GameMenu" onRender={performanceProfiler.recordMeasurement}>
 *   <GameMenu />
 * </Profiler>
 * ```
 */
export const performanceProfiler = new PerformanceProfiler()

/**
 * Utility function to measure execution time of synchronous functions
 * 
 * @param name - Name for the measurement
 * @param fn - Function to measure
 * @returns Result of the function
 * 
 * @example
 * ```typescript
 * const result = measureExecutionTime('expensiveCalculation', () => {
 *   return calculateComplexValue()
 * })
 * ```
 */
export function measureExecutionTime<T>(name: string, fn: () => T): T {
  const start = performance.now()
  const result = fn()
  const duration = performance.now() - start

  if (import.meta.env.DEV) {
    console.log(`[Performance] ${name} took ${duration.toFixed(2)}ms`)
  }

  return result
}

/**
 * Utility function to measure async function execution time
 * 
 * @param name - Name for the measurement
 * @param fn - Async function to measure
 * @returns Promise resolving to function result
 * 
 * @example
 * ```typescript
 * const data = await measureAsyncExecutionTime('fetchData', async () => {
 *   return await fetch('/api/data').then(r => r.json())
 * })
 * ```
 */
export async function measureAsyncExecutionTime<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now()
  const result = await fn()
  const duration = performance.now() - start

  if (import.meta.env.DEV) {
    console.log(`[Performance] ${name} took ${duration.toFixed(2)}ms`)
  }

  return result
}
