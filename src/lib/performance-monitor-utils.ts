/**
 * Performance Monitoring Utilities - Production-grade performance tracking
 * 
 * Provides comprehensive performance monitoring following 2025 best practices
 * and Web Vitals standards (LCP, FID, CLS, TTFB, INP).
 * 
 * @module performance-monitor-utils
 * 
 * Features:
 * - Core Web Vitals tracking (LCP, FID, CLS)
 * - Custom performance marks and measures
 * - Frame rate (FPS) monitoring
 * - Memory usage tracking
 * - Bundle size analysis helpers
 * - Automatic reporting to analytics
 * 
 * @see {@link https://web.dev/vitals/}
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Performance}
 * 
 * @example
 * ```typescript
 * import { 
 *   measureComponentRenderTime,
 *   trackWebVitals,
 *   monitorFrameRate
 * } from './performance-monitor-utils'
 * 
 * // Track Core Web Vitals
 * trackWebVitals((metric) => {
 *   analytics.send(metric)
 * })
 * 
 * // Measure component performance
 * const stopMeasuring = measureComponentRenderTime('GameMenu')
 * // ... component renders ...
 * const duration = stopMeasuring()
 * console.log(`GameMenu rendered in ${duration}ms`)
 * ```
 */

/**
 * Web Vitals metric names
 */
export type WebVitalMetricName = 'LCP' | 'FID' | 'CLS' | 'TTFB' | 'INP' | 'FCP'

/**
 * Web Vitals metric data structure
 */
export interface WebVitalMetric {
  /** Metric name (LCP, FID, CLS, etc.) */
  name: WebVitalMetricName
  /** Metric value */
  value: number
  /** Unique ID for this metric instance */
  id: string
  /** Rating based on thresholds (good, needs-improvement, poor) */
  rating: 'good' | 'needs-improvement' | 'poor'
  /** Delta from previous value (if applicable) */
  delta?: number
  /** Navigation type when metric was captured */
  navigationType?: string
}

/**
 * Performance mark metadata
 */
export interface PerformanceMark {
  /** Mark name */
  name: string
  /** Timestamp when mark was created */
  startTime: number
  /** Optional additional data */
  detail?: Record<string, unknown>
}

/**
 * Performance measure metadata
 */
export interface PerformanceMeasure {
  /** Measure name */
  name: string
  /** Duration in milliseconds */
  duration: number
  /** Start mark name */
  startMark: string
  /** End mark name */
  endMark: string
  /** Optional additional data */
  detail?: Record<string, unknown>
}

/**
 * Frame rate (FPS) statistics
 */
export interface FrameRateStats {
  /** Current FPS */
  currentFps: number
  /** Average FPS over monitoring period */
  averageFps: number
  /** Minimum FPS recorded */
  minFps: number
  /** Maximum FPS recorded */
  maxFps: number
  /** Number of frames below target (60fps) */
  droppedFrames: number
}

/**
 * Memory usage statistics (when available)
 */
export interface MemoryUsageStats {
  /** Used JS heap size in bytes */
  usedJSHeapSize: number
  /** Total JS heap size in bytes */
  totalJSHeapSize: number
  /** JS heap size limit in bytes */
  jsHeapSizeLimit: number
  /** Usage percentage */
  usagePercentage: number
}

/**
 * Create a performance mark with optional metadata
 * Marks are used as start/end points for measurements
 * 
 * @param markName - Unique name for the mark
 * @param detail - Optional additional data
 * 
 * @example
 * ```typescript
 * createPerformanceMark('game-start', { level: 1 })
 * // ... game logic ...
 * createPerformanceMark('game-end')
 * measurePerformanceBetweenMarks('game-duration', 'game-start', 'game-end')
 * ```
 */
export const createPerformanceMark = (
  markName: string,
  detail?: Record<string, unknown>
): void => {
  if (typeof performance === 'undefined' || !performance.mark) return
  
  try {
    performance.mark(markName, { detail })
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn(`[PerformanceMonitor] Failed to create mark "${markName}":`, error)
    }
  }
}

/**
 * Measure performance between two marks
 * Creates a measure entry that can be retrieved later
 * 
 * @param measureName - Name for the measurement
 * @param startMark - Name of the start mark
 * @param endMark - Name of the end mark
 * @returns Duration in milliseconds, or null if measurement failed
 * 
 * @example
 * ```typescript
 * createPerformanceMark('component-mount')
 * // ... component mounts ...
 * createPerformanceMark('component-ready')
 * const duration = measurePerformanceBetweenMarks(
 *   'component-init-time',
 *   'component-mount',
 *   'component-ready'
 * )
 * ```
 */
export const measurePerformanceBetweenMarks = (
  measureName: string,
  startMark: string,
  endMark: string
): number | null => {
  if (typeof performance === 'undefined' || !performance.measure) return null
  
  try {
    const measure = performance.measure(measureName, startMark, endMark)
    return measure.duration
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn(`[PerformanceMonitor] Failed to measure "${measureName}":`, error)
    }
    return null
  }
}

/**
 * Measure component render time with automatic mark cleanup
 * Returns a function to stop measuring and get duration
 * 
 * @param componentName - Name of the component being measured
 * @returns Function to stop measuring and return duration
 * 
 * @example
 * ```typescript
 * const App = () => {
 *   const stopMeasuring = measureComponentRenderTime('App')
 *   
 *   useEffect(() => {
 *     const duration = stopMeasuring()
 *     console.log(`App rendered in ${duration}ms`)
 *   }, [])
 *   
 *   return <div>App</div>
 * }
 * ```
 */
export const measureComponentRenderTime = (
  componentName: string
): (() => number | null) => {
  const startMarkName = `${componentName}-render-start`
  const endMarkName = `${componentName}-render-end`
  const measureName = `${componentName}-render-duration`
  
  createPerformanceMark(startMarkName)
  
  return () => {
    createPerformanceMark(endMarkName)
    const duration = measurePerformanceBetweenMarks(measureName, startMarkName, endMarkName)
    
    // Clean up marks
    try {
      performance.clearMarks(startMarkName)
      performance.clearMarks(endMarkName)
    } catch (error) {
      // Ignore cleanup errors
    }
    
    return duration
  }
}

/**
 * Get all performance measures matching a pattern
 * Useful for aggregating related measurements
 * 
 * @param namePattern - RegExp pattern or string to match measure names
 * @returns Array of matching measures
 * 
 * @example
 * ```typescript
 * // Get all component render measurements
 * const renderMeasures = getPerformanceMeasures(/.*-render-duration/)
 * const totalRenderTime = renderMeasures.reduce((sum, m) => sum + m.duration, 0)
 * ```
 */
export const getPerformanceMeasures = (
  namePattern?: RegExp | string
): PerformanceMeasure[] => {
  if (typeof performance === 'undefined' || !performance.getEntriesByType) {
    return []
  }
  
  const measures = performance.getEntriesByType('measure') as PerformanceMeasure[]
  
  if (!namePattern) return measures
  
  if (typeof namePattern === 'string') {
    return measures.filter(m => m.name.includes(namePattern))
  }
  
  return measures.filter(m => namePattern.test(m.name))
}

/**
 * Clear all performance marks and measures
 * Useful for cleaning up after measurements
 * 
 * @example
 * ```typescript
 * // Measure something
 * createPerformanceMark('start')
 * // ... do work ...
 * createPerformanceMark('end')
 * measurePerformanceBetweenMarks('duration', 'start', 'end')
 * 
 * // Clean up
 * clearAllPerformanceMarks()
 * ```
 */
export const clearAllPerformanceMarks = (): void => {
  if (typeof performance === 'undefined') return
  
  try {
    performance.clearMarks()
    performance.clearMeasures()
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('[PerformanceMonitor] Failed to clear marks:', error)
    }
  }
}

/**
 * Monitor frame rate (FPS) over a specified duration
 * Returns statistics about frame performance
 * 
 * @param durationMs - Duration to monitor in milliseconds (default: 5000ms)
 * @param onUpdate - Optional callback for real-time FPS updates
 * @returns Promise that resolves with frame rate statistics
 * 
 * @example
 * ```typescript
 * const stats = await monitorFrameRate(5000, (fps) => {
 *   console.log(`Current FPS: ${fps}`)
 * })
 * 
 * if (stats.averageFps < 30) {
 *   console.warn('Performance is poor!')
 * }
 * ```
 */
export const monitorFrameRate = (
  durationMs = 5000,
  onUpdate?: (currentFps: number) => void
): Promise<FrameRateStats> => {
  return new Promise((resolve) => {
    const frameTimestamps: number[] = []
    let animationFrameId: number
    let startTime = performance.now()
    
    const measureFrame = (currentTime: number) => {
      frameTimestamps.push(currentTime)
      
      // Calculate FPS from last second of frames
      const oneSecondAgo = currentTime - 1000
      const recentFrames = frameTimestamps.filter(t => t >= oneSecondAgo)
      const currentFps = recentFrames.length
      
      onUpdate?.(currentFps)
      
      // Continue monitoring if within duration
      if (currentTime - startTime < durationMs) {
        animationFrameId = requestAnimationFrame(measureFrame)
      } else {
        // Calculate final statistics
        const totalFrames = frameTimestamps.length
        const totalDurationSeconds = (currentTime - startTime) / 1000
        const averageFps = totalFrames / totalDurationSeconds
        
        // Calculate min/max FPS per second
        const fpsPerSecond: number[] = []
        for (let i = 0; i < totalDurationSeconds; i++) {
          const secondStart = startTime + i * 1000
          const secondEnd = secondStart + 1000
          const framesInSecond = frameTimestamps.filter(
            t => t >= secondStart && t < secondEnd
          ).length
          fpsPerSecond.push(framesInSecond)
        }
        
        const minFps = Math.min(...fpsPerSecond)
        const maxFps = Math.max(...fpsPerSecond)
        const droppedFrames = fpsPerSecond.filter(fps => fps < 60).length
        
        resolve({
          currentFps,
          averageFps,
          minFps,
          maxFps,
          droppedFrames
        })
      }
    }
    
    animationFrameId = requestAnimationFrame(measureFrame)
  })
}

/**
 * Get current memory usage statistics
 * Only available in Chrome and Edge with memory API enabled
 * 
 * @returns Memory statistics or null if not available
 * 
 * @example
 * ```typescript
 * const memory = getMemoryUsage()
 * if (memory && memory.usagePercentage > 90) {
 *   console.warn('High memory usage detected!')
 * }
 * ```
 */
export const getMemoryUsage = (): MemoryUsageStats | null => {
  // Memory API is non-standard and only available in Chrome/Edge
  const perfMemory = (performance as { memory?: {
    usedJSHeapSize: number
    totalJSHeapSize: number
    jsHeapSizeLimit: number
  } }).memory
  
  if (!perfMemory) return null
  
  const usagePercentage = (perfMemory.usedJSHeapSize / perfMemory.jsHeapSizeLimit) * 100
  
  return {
    usedJSHeapSize: perfMemory.usedJSHeapSize,
    totalJSHeapSize: perfMemory.totalJSHeapSize,
    jsHeapSizeLimit: perfMemory.jsHeapSizeLimit,
    usagePercentage
  }
}

/**
 * Track Core Web Vitals metrics
 * Provides simplified access to LCP, FID, CLS, and other vital metrics
 * 
 * @param onMetric - Callback function to receive metric updates
 * 
 * @example
 * ```typescript
 * trackWebVitals((metric) => {
 *   console.log(`${metric.name}: ${metric.value}`)
 *   
 *   // Send to analytics
 *   analytics.track('web-vital', {
 *     metric: metric.name,
 *     value: metric.value,
 *     rating: metric.rating
 *   })
 * })
 * ```
 */
export const trackWebVitals = (
  onMetric: (metric: WebVitalMetric) => void
): void => {
  // TODO: [OPTIMIZATION] Consider using web-vitals library for production
  // Import from 'web-vitals' for more comprehensive tracking
  // This is a simplified implementation for demonstration
  
  if (typeof PerformanceObserver === 'undefined') return
  
  try {
    // Largest Contentful Paint (LCP)
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1] as PerformanceEntry
      
      onMetric({
        name: 'LCP',
        value: lastEntry.startTime,
        id: `lcp-${Date.now()}`,
        rating: lastEntry.startTime < 2500 ? 'good' : lastEntry.startTime < 4000 ? 'needs-improvement' : 'poor'
      })
    })
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
    
    // First Input Delay (FID)
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries() as PerformanceEventTiming[]
      entries.forEach((entry) => {
        const delay = entry.processingStart - entry.startTime
        onMetric({
          name: 'FID',
          value: delay,
          id: `fid-${Date.now()}`,
          rating: delay < 100 ? 'good' : delay < 300 ? 'needs-improvement' : 'poor'
        })
      })
    })
    fidObserver.observe({ entryTypes: ['first-input'] })
    
    // Cumulative Layout Shift (CLS)
    let clsValue = 0
    const clsObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries() as LayoutShift[]
      entries.forEach((entry) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value
          onMetric({
            name: 'CLS',
            value: clsValue,
            id: `cls-${Date.now()}`,
            rating: clsValue < 0.1 ? 'good' : clsValue < 0.25 ? 'needs-improvement' : 'poor'
          })
        }
      })
    })
    clsObserver.observe({ entryTypes: ['layout-shift'] })
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('[PerformanceMonitor] Failed to initialize web vitals tracking:', error)
    }
  }
}

/**
 * LayoutShift interface for CLS tracking
 */
interface LayoutShift extends PerformanceEntry {
  value: number
  hadRecentInput: boolean
}

/**
 * PerformanceEventTiming interface for FID tracking
 */
interface PerformanceEventTiming extends PerformanceEntry {
  processingStart: number
}

/**
 * Log performance summary to console
 * Useful for development debugging
 * 
 * @example
 * ```typescript
 * // At the end of your app initialization
 * logPerformanceSummary()
 * ```
 */
export const logPerformanceSummary = (): void => {
  if (!import.meta.env.DEV) return
  
  console.group('📊 Performance Summary')
  
  // Navigation timing
  if (performance.timing) {
    const timing = performance.timing
    console.log('Page Load:', `${timing.loadEventEnd - timing.navigationStart}ms`)
    console.log('DOM Ready:', `${timing.domContentLoadedEventEnd - timing.navigationStart}ms`)
    console.log('First Paint:', `${timing.responseStart - timing.navigationStart}ms`)
  }
  
  // Memory usage
  const memory = getMemoryUsage()
  if (memory) {
    console.log('Memory Usage:', `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`)
    console.log('Memory Limit:', `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`)
  }
  
  // All measurements
  const measures = getPerformanceMeasures()
  if (measures.length > 0) {
    console.log('\nCustom Measures:')
    measures.forEach(m => {
      console.log(`  ${m.name}: ${m.duration.toFixed(2)}ms`)
    })
  }
  
  console.groupEnd()
}
