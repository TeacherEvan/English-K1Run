/**
 * Performance Tracker - Frame rate and spawn rate monitoring
 *
 * Split from event-tracker.ts (Jan 2026) for better code organization.
 * Tracks:
 * - Frame rate (FPS) via requestAnimationFrame
 * - Object spawn rate per second
 * - Touch input latency
 *
 * @module performance-tracker
 */

export interface PerformanceMetrics {
  objectSpawnRate: number;
  frameRate: number;
  memoryUsage?: number;
  touchLatency: number;
}

export class PerformanceTracker {
  private performanceMetrics: PerformanceMetrics = {
    objectSpawnRate: 0,
    frameRate: 0,
    touchLatency: 0,
  };

  private spawnCount = 0;
  private lastSpawnReset = Date.now();

  // Frame rate monitoring
  private isPerformanceMonitoringActive = false;
  private performanceAnimationFrameId: number | null = null;

  /**
   * Start performance monitoring (call when gameplay starts)
   * Uses requestAnimationFrame to measure frame rate
   */
  startPerformanceMonitoring() {
    if (this.isPerformanceMonitoringActive) return;
    this.isPerformanceMonitoringActive = true;

    let frameCount = 0;
    let lastTime = performance.now();

    const measureFrameRate = () => {
      if (!this.isPerformanceMonitoringActive) return;

      frameCount++;
      const currentTime = performance.now();

      if (currentTime - lastTime >= 1000) {
        this.performanceMetrics.frameRate = frameCount;
        frameCount = 0;
        lastTime = currentTime;

        // Warn on low frame rate (dev only)
        if (import.meta.env.DEV && this.performanceMetrics.frameRate < 30) {
          console.warn(
            "[PerformanceTracker] Low FPS:",
            this.performanceMetrics.frameRate
          );
        }
      }

      this.performanceAnimationFrameId =
        requestAnimationFrame(measureFrameRate);
    };

    this.performanceAnimationFrameId = requestAnimationFrame(measureFrameRate);
  }

  /**
   * Stop performance monitoring (call when gameplay ends)
   */
  stopPerformanceMonitoring() {
    this.isPerformanceMonitoringActive = false;
    if (this.performanceAnimationFrameId !== null) {
      cancelAnimationFrame(this.performanceAnimationFrameId);
      this.performanceAnimationFrameId = null;
    }
    this.performanceMetrics.frameRate = 0;
  }

  /**
   * Track object spawn and calculate spawn rate
   */
  trackObjectSpawn() {
    this.spawnCount++;

    const now = Date.now();
    if (now - this.lastSpawnReset >= 2000) {
      this.performanceMetrics.objectSpawnRate = this.spawnCount / 2;
      this.spawnCount = 0;
      this.lastSpawnReset = now;

      // Warn on high spawn rate
      if (this.performanceMetrics.objectSpawnRate > 8) {
        if (import.meta.env.DEV) {
          console.warn(
            "[PerformanceTracker] High spawn rate:",
            this.performanceMetrics.objectSpawnRate
          );
        }
      }
    }
  }

  /**
   * Track touch input latency
   */
  trackTouchLatency(latency: number) {
    this.performanceMetrics.touchLatency = latency;
  }

  /**
   * Get current performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  /**
   * Reset performance metrics
   */
  resetPerformanceMetrics() {
    this.spawnCount = 0;
    this.lastSpawnReset = Date.now();
    this.performanceMetrics.objectSpawnRate = 0;
    this.performanceMetrics.touchLatency = 0;
  }
}

// Export singleton instance
export const performanceTracker = new PerformanceTracker();
