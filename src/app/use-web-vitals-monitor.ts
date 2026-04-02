import { useEffect } from "react";
import { trackWebVitals } from "../lib/performance-monitor-utils";

/**
 * Initializes Web Vitals monitoring on mount.
 */
export const useWebVitalsMonitor = () => {
  useEffect(() => {
    if (!import.meta.env.DEV) {
      return
    }

    trackWebVitals((metric) => {
      console.log(
        `[Web Vitals] ${metric.name}: ${metric.value.toFixed(2)}ms (${metric.rating})`,
      );
    });
  }, []);
};
