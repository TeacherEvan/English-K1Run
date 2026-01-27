import { getPerformanceMeasures } from "./marks-and-measures";
import { getMemoryUsage } from "./memory-utils";

/**
 * Log performance summary to console
 * Useful for development debugging
 */
export const logPerformanceSummary = (): void => {
  if (!import.meta.env.DEV) return;

  console.group("📊 Performance Summary");

  // Navigation timing
  if (performance.timing) {
    const timing = performance.timing;
    console.log(
      "Page Load:",
      `${timing.loadEventEnd - timing.navigationStart}ms`,
    );
    console.log(
      "DOM Ready:",
      `${timing.domContentLoadedEventEnd - timing.navigationStart}ms`,
    );
    console.log(
      "First Paint:",
      `${timing.responseStart - timing.navigationStart}ms`,
    );
  }

  // Memory usage
  const memory = getMemoryUsage();
  if (memory) {
    console.log(
      "Memory Usage:",
      `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
    );
    console.log(
      "Memory Limit:",
      `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`,
    );
  }

  // All measurements
  const measures = getPerformanceMeasures();
  if (measures.length > 0) {
    console.log("\nCustom Measures:");
    measures.forEach((measure) => {
      console.log(`  ${measure.name}: ${measure.duration.toFixed(2)}ms`);
    });
  }

  console.groupEnd();
};
