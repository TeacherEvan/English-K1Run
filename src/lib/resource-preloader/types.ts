/**
 * Resource type definitions and interfaces
 */

/**
 * Resource priority levels for intelligent preloading
 */
export type ResourcePriority = "high" | "medium" | "low";

/**
 * Resource type classification for optimal loading strategy
 */
export type ResourceType = "image" | "audio" | "font" | "script" | "style";

/**
 * Resource metadata for tracking and optimization
 */
export interface ResourceMetadata {
  url: string;
  type: ResourceType;
  priority: ResourcePriority;
  cacheDuration?: number;
  crossOrigin?: "anonymous" | "use-credentials";
}

/**
 * Progress tracking for resource loading operations
 */
export interface PreloadProgress {
  total: number;
  loaded: number;
  failed: number;
  percentage: number;
  failedResources: string[];
}
