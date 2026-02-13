/**
 * Progress tracking for resource preloading
 */

import type { PreloadProgress } from "./types";

/**
 * Global preload progress state
 */
let globalPreloadProgress: PreloadProgress = {
  total: 0,
  loaded: 0,
  failed: 0,
  percentage: 0,
  failedResources: [],
};

/**
 * Get current preload progress
 */
export const getPreloadProgress = (): PreloadProgress => {
  return { ...globalPreloadProgress };
};

/**
 * Reset preload progress to initial state
 */
export const resetPreloadProgress = (): void => {
  globalPreloadProgress = {
    total: 0,
    loaded: 0,
    failed: 0,
    percentage: 0,
    failedResources: [],
  };
};

/**
 * Update progress (internal use)
 */
export const updateProgress = (
  loaded: number,
  failed: number,
  total: number,
  failedUrl?: string
): void => {
  globalPreloadProgress.loaded = loaded;
  globalPreloadProgress.failed = failed;
  globalPreloadProgress.total = total;
  globalPreloadProgress.percentage = total > 0 ? Math.round((loaded / total) * 100) : 0;

  if (failedUrl && !globalPreloadProgress.failedResources.includes(failedUrl)) {
    globalPreloadProgress.failedResources.push(failedUrl);
  }
};
