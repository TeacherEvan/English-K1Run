import type { FrameRateStats } from "./types";

/**
 * Monitor frame rate (FPS) over a specified duration
 * Returns statistics about frame performance
 */
export const monitorFrameRate = (
  durationMs = 5000,
  onUpdate?: (currentFps: number) => void,
): Promise<FrameRateStats> => {
  return new Promise((resolve) => {
    const frameTimestamps: number[] = [];
    const startTime = performance.now();

    const measureFrame = (currentTime: number) => {
      frameTimestamps.push(currentTime);

      // Calculate FPS from last second of frames
      const oneSecondAgo = currentTime - 1000;
      const recentFrames = frameTimestamps.filter(
        (time) => time >= oneSecondAgo,
      );
      const currentFps = recentFrames.length;

      onUpdate?.(currentFps);

      // Continue monitoring if within duration
      if (currentTime - startTime < durationMs) {
        requestAnimationFrame(measureFrame);
      } else {
        // Calculate final statistics
        const totalFrames = frameTimestamps.length;
        const totalDurationSeconds = (currentTime - startTime) / 1000;
        const averageFps = totalFrames / totalDurationSeconds;

        // Calculate min/max FPS per second
        const fpsPerSecond: number[] = [];
        for (let i = 0; i < totalDurationSeconds; i += 1) {
          const secondStart = startTime + i * 1000;
          const secondEnd = secondStart + 1000;
          const framesInSecond = frameTimestamps.filter(
            (time) => time >= secondStart && time < secondEnd,
          ).length;
          fpsPerSecond.push(framesInSecond);
        }

        const minFps = Math.min(...fpsPerSecond);
        const maxFps = Math.max(...fpsPerSecond);
        const droppedFrames = fpsPerSecond.filter((fps) => fps < 60).length;

        resolve({
          currentFps,
          averageFps,
          minFps,
          maxFps,
          droppedFrames,
        });
      }
    };

    requestAnimationFrame(measureFrame);
  });
};
