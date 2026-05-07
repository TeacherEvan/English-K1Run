import { useEffect } from "react";

/**
 * Initializes Web Vitals monitoring on mount.
 * Only active in development builds; web-vitals is loaded dynamically
 * to avoid adding it to the production bundle.
 */
export const useWebVitalsMonitor = () => {
  useEffect(() => {
    if (!import.meta.env.DEV) {
      return
    }

    import("../lib/performance-monitor-utils").then(({ trackWebVitals }) => {
      trackWebVitals((metric) => {
        console.log(
          `[Web Vitals] ${metric.name}: ${metric.value.toFixed(2)}ms (${metric.rating})`,
        );
      });
    });
  }, []);
};
