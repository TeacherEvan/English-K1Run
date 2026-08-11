/**
 * Background image preloader for optimizing Core Web Vitals.
 * Lazily loads background images to improve LCP and reduce initial bundle size.
 */

import { useEffect } from "react";
import { isLimitedBandwidth } from "../resource-preloader/bandwidth-detection";

// Map CSS class names to their background image URLs
const BACKGROUND_IMAGE_MAP: Record<string, string> = {
  "app-bg-mountain-sunrise": "/backgrounds/mountain-sunrise.jpg",
  "app-bg-ocean-sunset": "/backgrounds/ocean-sunset.jpg",
  "app-bg-forest-path": "/backgrounds/forest-path.jpg",
  "app-bg-lavender-field": "/backgrounds/lavender-field.jpg",
  "app-bg-aurora-night": "/backgrounds/aurora-night.jpg",
  "app-bg-nebula-galaxy": "/backgrounds/nebula-galaxy.jpg",
  "app-bg-tropical-waterfall": "/backgrounds/tropical-waterfall.jpg",
  "app-bg-colorful-buildings": "/backgrounds/colorful-buildings.jpg",
  "app-bg-cherry-blossom": "/backgrounds/cherry-blossom.jpg",
  "app-bg-starry-art": "/backgrounds/starry-art.jpg",
};

// Cache for loaded images
const loadedImages = new Set<string>();
const BACKGROUND_PRELOAD_DELAY_MS = 8000;

/**
 * Preload a background image
 */
function preloadBackgroundImage(className: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const imageUrl = BACKGROUND_IMAGE_MAP[className];
    if (!imageUrl) {
      resolve(); // No image to load
      return;
    }

    if (loadedImages.has(className)) {
      resolve(); // Already loaded
      return;
    }

    const img = new Image();
    img.onload = () => {
      loadedImages.add(className);
      resolve();
    };
    img.onerror = reject;
    img.src = imageUrl;
  });
}

/**
 * Preload multiple background images with concurrency control
 */
export async function preloadBackgroundImages(
  classNames: string[],
  concurrency = 2,
  shouldContinue: () => boolean = () => true,
): Promise<void> {
  const toLoad = classNames.filter((name) => !loadedImages.has(name));

  if (toLoad.length === 0) return;

  // Load in batches to avoid overwhelming the network
  for (let i = 0; i < toLoad.length; i += concurrency) {
    if (!shouldContinue()) {
      return;
    }

    const batch = toLoad.slice(i, i + concurrency);
    await Promise.allSettled(batch.map(preloadBackgroundImage));
  }
}

/**
 * Hook to lazily preload background images when they become likely to be used
 */
export function useLazyBackgroundPreloader(enabled = true) {
  useEffect(() => {
    if (!enabled || isLimitedBandwidth()) return;

    let cancelled = false;
    let idleId: number | null = null;

    const startPreload = () => {
      if (cancelled || document.visibilityState === "hidden") {
        return;
      }

      void preloadBackgroundImages(
        Object.keys(BACKGROUND_IMAGE_MAP),
        1,
        () => !cancelled,
      )
        .catch(console.warn)
        .finally(() => {
          idleId = null;
        });
    };

    const queuePreload = () => {
      if (cancelled) {
        return;
      }

      if ("requestIdleCallback" in window) {
        idleId = window.requestIdleCallback(startPreload, {
          timeout: 2500,
        });
        return;
      }

      startPreload();
    };

    // Wait until the menu has been stable for a while before warming decorative images.
    const timer = window.setTimeout(queuePreload, BACKGROUND_PRELOAD_DELAY_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      if (idleId !== null && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleId);
      }
    };
  }, [enabled]);
}

/**
 * Check if a background image is loaded
 */
export function isBackgroundLoaded(className: string): boolean {
  return loadedImages.has(className);
}

/**
 * Get loading progress (for potential progress indicators)
 */
export function getBackgroundLoadingProgress(): {
  loaded: number;
  total: number;
} {
  const total = Object.keys(BACKGROUND_IMAGE_MAP).length;
  const loaded = loadedImages.size;
  return { loaded, total };
}
