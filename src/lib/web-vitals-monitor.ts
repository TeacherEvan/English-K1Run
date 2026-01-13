/**
 * Web Vitals Performance Monitor
 *
 * Integrates Google's web-vitals library for production-grade performance monitoring.
 * Tracks Core Web Vitals metrics that impact user experience and SEO.
 *
 * Metrics tracked:
 * - CLS (Cumulative Layout Shift): Visual stability
 * - FCP (First Contentful Paint): Loading performance
 * - LCP (Largest Contentful Paint): Loading performance
 * - TTFB (Time to First Byte): Server response time
 * - INP (Interaction to Next Paint): Responsiveness
 *
 * @see https://web.dev/vitals/
 */

import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from "web-vitals";

/**
 * Report metric to console in development
 */
function reportMetric(metric: Metric): void {
  if (import.meta.env.DEV) {
    const emoji =
      metric.rating === "good"
        ? "✅"
        : metric.rating === "needs-improvement"
          ? "⚠️"
          : "❌";
    console.log(
      `${emoji} [Web Vitals] ${metric.name}: ${metric.value.toFixed(2)}ms (${metric.rating})`
    );
  }

  // Send to analytics in production (customize this)
  if (import.meta.env.PROD) {
    // Example: Google Analytics 4
    // gtag('event', metric.name, {
    //   value: metric.value,
    //   metric_id: metric.id,
    // });
  }
}

/**
 * Initialize web vitals monitoring
 * Call this once on app startup
 */
export function initWebVitalsMonitoring(): void {
  try {
    onCLS(reportMetric);
    onFCP(reportMetric);
    onINP(reportMetric);
    onLCP(reportMetric);
    onTTFB(reportMetric);

    if (import.meta.env.DEV) {
      console.log("[Web Vitals] Monitoring initialized");
    }
  } catch (error) {
    console.error("[Web Vitals] Failed to initialize:", error);
  }
}
