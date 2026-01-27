import type { MemoryUsageStats } from "./types";

/**
 * Get current memory usage statistics
 * Only available in Chrome and Edge with memory API enabled
 */
export const getMemoryUsage = (): MemoryUsageStats | null => {
  // Memory API is non-standard and only available in Chrome/Edge
  const perfMemory = (
    performance as {
      memory?: {
        usedJSHeapSize: number;
        totalJSHeapSize: number;
        jsHeapSizeLimit: number;
      };
    }
  ).memory;

  if (!perfMemory) return null;

  const usagePercentage =
    (perfMemory.usedJSHeapSize / perfMemory.jsHeapSizeLimit) * 100;

  return {
    usedJSHeapSize: perfMemory.usedJSHeapSize,
    totalJSHeapSize: perfMemory.totalJSHeapSize,
    jsHeapSizeLimit: perfMemory.jsHeapSizeLimit,
    usagePercentage,
  };
};
