// FPS tracking helpers for DisplayInfo component

// FPS tracking state
let frameCount = 0;
let lastFpsTime = performance.now();
let currentFps = 0;

/**
 * Updates FPS tracking counters (called by DisplayInfo component)
 * @internal
 */
export const updateFpsTracking = () => {
  frameCount++;
  const now = performance.now();
  if (now - lastFpsTime >= 1000) {
    currentFps = frameCount;
    frameCount = 0;
    lastFpsTime = now;
  }
  return currentFps;
};

/**
 * Gets the current FPS value
 * @returns Current frames per second
 */
export const getFps = () => currentFps;
