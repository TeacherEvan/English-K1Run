export type WebVitalMetricName = "LCP" | "FID" | "CLS" | "TTFB" | "INP" | "FCP";

/**
 * Web Vitals metric data structure
 */
export interface WebVitalMetric {
  /** Metric name (LCP, FID, CLS, etc.) */
  name: WebVitalMetricName;
  /** Metric value */
  value: number;
  /** Unique ID for this metric instance */
  id: string;
  /** Rating based on thresholds (good, needs-improvement, poor) */
  rating: "good" | "needs-improvement" | "poor";
  /** Delta from previous value (if applicable) */
  delta?: number;
  /** Navigation type when metric was captured */
  navigationType?: string;
}

/**
 * Performance mark metadata
 */
export interface PerformanceMark {
  /** Mark name */
  name: string;
  /** Timestamp when mark was created */
  startTime: number;
  /** Optional additional data */
  detail?: Record<string, unknown>;
}

/**
 * Performance measure metadata
 */
export interface PerformanceMeasure {
  /** Measure name */
  name: string;
  /** Duration in milliseconds */
  duration: number;
  /** Start mark name */
  startMark: string;
  /** End mark name */
  endMark: string;
  /** Optional additional data */
  detail?: Record<string, unknown>;
}

/**
 * Frame rate (FPS) statistics
 */
export interface FrameRateStats {
  /** Current FPS */
  currentFps: number;
  /** Average FPS over monitoring period */
  averageFps: number;
  /** Minimum FPS recorded */
  minFps: number;
  /** Maximum FPS recorded */
  maxFps: number;
  /** Number of frames below target (60fps) */
  droppedFrames: number;
}

/**
 * Memory usage statistics (when available)
 */
export interface MemoryUsageStats {
  /** Used JS heap size in bytes */
  usedJSHeapSize: number;
  /** Total JS heap size in bytes */
  totalJSHeapSize: number;
  /** JS heap size limit in bytes */
  jsHeapSizeLimit: number;
  /** Usage percentage */
  usagePercentage: number;
}

export interface LayoutShift extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
}

export interface PerformanceEventTiming extends PerformanceEntry {
  processingStart: number;
}
