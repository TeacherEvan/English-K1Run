/**
 * Resource Preloader - Barrel export for backward compatibility
 */

export * from "./types";
export { getPreloadProgress, resetPreloadProgress } from "./progress";
export { isLimitedBandwidth } from "./bandwidth-detection";
export { preloadResources, preloadCriticalResources } from "./orchestration";
