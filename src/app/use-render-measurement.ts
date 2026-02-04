import { useEffect, useMemo } from "react";
import { measureComponentRenderTime } from "../lib/performance-monitor-utils";

/**
 * Measures initial render duration for the App component.
 */
export const useRenderMeasurement = () => {
  const stopRenderMeasurement = useMemo(
    () => measureComponentRenderTime("App"),
    [],
  );

  useEffect(() => {
    const duration = stopRenderMeasurement();
    if (import.meta.env.DEV && duration !== null) {
      console.log(`[Performance] App rendered in ${duration.toFixed(2)}ms`);
    }
  }, [stopRenderMeasurement]);
};
