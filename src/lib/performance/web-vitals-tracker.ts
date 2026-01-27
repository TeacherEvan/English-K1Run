import { generateUniqueIdentifier } from "../semantic-utils";
import type {
  LayoutShift,
  PerformanceEventTiming,
  WebVitalMetric,
} from "./types";

/**
 * Track Core Web Vitals metrics
 * Provides simplified access to LCP, FID, CLS, and other vital metrics
 */
export const trackWebVitals = (
  onMetric: (metric: WebVitalMetric) => void,
): void => {
  // TODO: [OPTIMIZATION] Consider using web-vitals library for production
  // Import from 'web-vitals' for more comprehensive tracking
  // This is a simplified implementation for demonstration

  if (typeof PerformanceObserver === "undefined") return;

  try {
    // Largest Contentful Paint (LCP)
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as PerformanceEntry;

      onMetric({
        name: "LCP",
        value: lastEntry.startTime,
        id: generateUniqueIdentifier("lcp"),
        rating:
          lastEntry.startTime < 2500
            ? "good"
            : lastEntry.startTime < 4000
              ? "needs-improvement"
              : "poor",
      });
    });
    lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });

    // First Input Delay (FID)
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries() as PerformanceEventTiming[];
      entries.forEach((entry) => {
        const delay = entry.processingStart - entry.startTime;
        onMetric({
          name: "FID",
          value: delay,
          id: generateUniqueIdentifier("fid"),
          rating:
            delay < 100 ? "good" : delay < 300 ? "needs-improvement" : "poor",
        });
      });
    });
    fidObserver.observe({ entryTypes: ["first-input"] });

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries() as LayoutShift[];
      entries.forEach((entry) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
          onMetric({
            name: "CLS",
            value: clsValue,
            id: generateUniqueIdentifier("cls"),
            rating:
              clsValue < 0.1
                ? "good"
                : clsValue < 0.25
                  ? "needs-improvement"
                  : "poor",
          });
        }
      });
    });
    clsObserver.observe({ entryTypes: ["layout-shift"] });
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn(
        "[PerformanceMonitor] Failed to initialize web vitals tracking:",
        error,
      );
    }
  }
};
