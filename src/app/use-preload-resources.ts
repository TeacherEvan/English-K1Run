import { useEffect } from "react";
import { announceToScreenReader } from "../lib/accessibility-utils";
import type { PreloadProgress } from "../lib/resource-preloader";
import { preloadCriticalResources } from "../lib/resource-preloader";

/**
 * Preloads critical resources and announces completion for accessibility.
 */
export const usePreloadResources = () => {
  useEffect(() => {
    preloadCriticalResources(["high", "medium"])
      .then((progress: PreloadProgress) => {
        if (import.meta.env.DEV) {
          console.log(
            `[Preload] Loaded ${progress.loaded}/${progress.total} resources (failed: ${progress.failed})`,
          );
        }
        announceToScreenReader("Game resources loaded", "polite");
      })
      .catch((error: unknown) => {
        if (import.meta.env.DEV) {
          console.warn("[Preload] Resource preloading failed:", error);
        }
      });
  }, []);
};
