import { useEffect } from "react";
import { announceToScreenReader } from "../lib/accessibility-utils";
import type { PreloadProgress } from "../lib/resource-preloader";
import { preloadCriticalResources } from "../lib/resource-preloader";

/**
 * Preloads critical resources after the UI is interactive.
 */
export const usePreloadResources = (enabled = true) => {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    let cancelled = false;

    const startPreload = () => {
      if (cancelled) {
        return;
      }

      preloadCriticalResources(["high", "medium"])
        .then((progress: PreloadProgress) => {
          if (cancelled) {
            return;
          }
          if (import.meta.env.DEV) {
            console.log(
              `[Preload] Loaded ${progress.loaded}/${progress.total} resources (failed: ${progress.failed})`,
            );
          }
          announceToScreenReader("Game resources loaded", "polite");
        })
        .catch((error: unknown) => {
          if (cancelled || !import.meta.env.DEV) {
            return;
          }
          console.warn("[Preload] Resource preloading failed:", error);
        });
    };

    if ("requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(startPreload, {
        timeout: 2000,
      });

      return () => {
        cancelled = true;
        window.cancelIdleCallback(idleId);
      };
    }

    const timer = setTimeout(startPreload, 1200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [enabled]);
};
