import { useEffect } from "react";
import { announceToScreenReader } from "../lib/accessibility-utils";
import { preloadCriticalResources } from "../lib/resource-preloader";

/**
 * Preloads critical resources and announces completion for accessibility.
 */
export const usePreloadResources = () => {
  useEffect(() => {
    preloadCriticalResources(["high", "medium"])
      .then((progress) => {
        if (import.meta.env.DEV) {
          console.log(
            `[Preload] Loaded ${progress.loaded}/${progress.total} resources (failed: ${progress.failed})`,
          );
        }
        announceToScreenReader("Game resources loaded", "polite");
      })
      .catch((error) => {
        if (import.meta.env.DEV) {
          console.warn("[Preload] Resource preloading failed:", error);
        }
      });
  }, []);
};
