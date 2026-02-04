import { useEffect } from "react";
import { trackWebVitals } from "../lib/performance-monitor-utils";

/**
 * Initializes Web Vitals monitoring on mount.
 */
export const useWebVitalsMonitor = () => {
  useEffect(() => {
    trackWebVitals((metric) => {
      if (import.meta.env.DEV) {
        console.log(
          `[Web Vitals] ${metric.name}: ${metric.value.toFixed(2)}ms (${metric.rating})`,
        );
      }
    });
  }, []);
};
