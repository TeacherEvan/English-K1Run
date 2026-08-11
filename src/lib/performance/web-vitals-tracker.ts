import {
  onCLS,
  onFCP,
  onINP,
  onLCP,
  onTTFB,
  type Metric,
} from "web-vitals";
import type { WebVitalMetric } from "./types";

/**
 * Track Core Web Vitals metrics
 * Provides simplified access to LCP, FID, CLS, and other vital metrics
 */
export const trackWebVitals = (
  onMetric: (metric: WebVitalMetric) => void,
): void => {
  if (typeof window === "undefined") return;

  const reportMetric = (metric: Metric) => {
    onMetric({
      name: metric.name,
      value: metric.value,
      id: metric.id,
      rating: metric.rating,
      delta: metric.delta,
      navigationType: metric.navigationType,
    });
  };

  try {
    const options = { reportAllChanges: import.meta.env.DEV };

    onCLS(reportMetric, options);
    onFCP(reportMetric, options);
    onINP(reportMetric, options);
    onLCP(reportMetric, options);
    onTTFB(reportMetric, options);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn(
        "[PerformanceMonitor] Failed to initialize web vitals tracking:",
        error,
      );
    }
  }
};
