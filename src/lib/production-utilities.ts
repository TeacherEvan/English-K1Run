/**
 * Barrel export for production-grade utilities
 * 
 * Provides convenient single-import access to all performance and optimization utilities.
 * 
 * @module production-utilities
 * 
 * Usage:
 * ```typescript
 * import {
 *   useOptimisticUI,
 *   performanceProfiler,
 *   useProgressiveImage
 * } from '@/lib/production-utilities'
 * ```
 */

// React 19 Concurrent Features
export { useOptimisticUI, withOptimisticUpdate } from '../hooks/use-optimistic-ui'
export type { OptimisticUIHook } from '../hooks/use-optimistic-ui'

// Performance Monitoring
export {
  performanceProfiler,
  measureExecutionTime,
  measureAsyncExecutionTime
} from './performance-profiler'
export type {
  PerformanceMeasurement,
  ProfilerConfig
} from './performance-profiler'

// Progressive Image Loading
export {
  useProgressiveImage,
  generatePlaceholder,
  preloadImages,
  imageCache
} from './progressive-image-loader'
export type {
  ImageLoadingState,
  ProgressiveImageReturn
} from './progressive-image-loader'
