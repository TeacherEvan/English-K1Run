import type { PerformanceMeasure } from "./types";

/**
 * Create a performance mark with optional metadata
 * Marks are used as start/end points for measurements
 */
export const createPerformanceMark = (
  markName: string,
  detail?: Record<string, unknown>,
): void => {
  if (typeof performance === "undefined" || !performance.mark) return;

  try {
    performance.mark(markName, { detail });
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn(
        `[PerformanceMonitor] Failed to create mark "${markName}":`,
        error,
      );
    }
  }
};

/**
 * Measure performance between two marks
 * Creates a measure entry that can be retrieved later
 */
export const measurePerformanceBetweenMarks = (
  measureName: string,
  startMark: string,
  endMark: string,
): number | null => {
  if (typeof performance === "undefined" || !performance.measure) return null;

  try {
    const measure = performance.measure(measureName, startMark, endMark);
    return measure.duration;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn(
        `[PerformanceMonitor] Failed to measure "${measureName}":`,
        error,
      );
    }
    return null;
  }
};

/**
 * Measure component render time with automatic mark cleanup
 * Returns a function to stop measuring and get duration
 */
export const measureComponentRenderTime = (
  componentName: string,
): (() => number | null) => {
  const startMarkName = `${componentName}-render-start`;
  const endMarkName = `${componentName}-render-end`;
  const measureName = `${componentName}-render-duration`;

  createPerformanceMark(startMarkName);

  return () => {
    createPerformanceMark(endMarkName);
    const duration = measurePerformanceBetweenMarks(
      measureName,
      startMarkName,
      endMarkName,
    );

    // Clean up marks
    try {
      performance.clearMarks(startMarkName);
      performance.clearMarks(endMarkName);
    } catch {
      // Ignore cleanup errors
    }

    return duration;
  };
};

/**
 * Get all performance measures matching a pattern
 * Useful for aggregating related measurements
 */
export const getPerformanceMeasures = (
  namePattern?: RegExp | string,
): PerformanceMeasure[] => {
  if (typeof performance === "undefined" || !performance.getEntriesByType) {
    return [];
  }

  const measures = performance.getEntriesByType(
    "measure",
  ) as unknown as PerformanceMeasure[];

  if (!namePattern) return measures;

  if (typeof namePattern === "string") {
    return measures.filter((measure) => measure.name.includes(namePattern));
  }

  return measures.filter((measure) => namePattern.test(measure.name));
};

/**
 * Clear all performance marks and measures
 * Useful for cleaning up after measurements
 */
export const clearAllPerformanceMarks = (): void => {
  if (typeof performance === "undefined") return;

  try {
    performance.clearMarks();
    performance.clearMeasures();
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn("[PerformanceMonitor] Failed to clear marks:", error);
    }
  }
};
