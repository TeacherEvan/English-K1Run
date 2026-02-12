/**
 * Resource preloading orchestration
 */

import type { ResourceMetadata, ResourcePriority } from "./types";
import { isLimitedBandwidth } from "./bandwidth-detection";
import { updateProgress } from "./progress";

/**
 * Preload an image resource with error handling and retry logic
 *
 * @param url - Image URL to preload
 * @param maxRetries - Maximum number of retry attempts (default: 2)
 * @returns Promise that resolves when image is loaded
 */
const preloadImage = (url: string, maxRetries = 2): Promise<void> => {
  return new Promise((resolve, reject) => {
    let retryCount = 0;

    const attemptLoad = () => {
      const img = new Image();

      img.onload = () => {
        resolve();
      };

      img.onerror = () => {
        retryCount++;
        if (retryCount <= maxRetries) {
          // Exponential backoff: 500ms, 1000ms, 2000ms
          const backoffDelay = 500 * Math.pow(2, retryCount - 1);
          setTimeout(attemptLoad, backoffDelay);
        } else {
          reject(new Error(`Failed to load image: ${url}`));
        }
      };

      img.src = url;
    };

    attemptLoad();
  });
};

/**
 * Preload an audio resource using HTML Audio element
 *
 * @param url - Audio URL to preload
 * @returns Promise that resolves when audio metadata is loaded
 */
const preloadAudio = (url: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const audio = new Audio();

    audio.oncanplaythrough = () => {
      resolve();
    };

    audio.onerror = () => {
      reject(new Error(`Failed to load audio: ${url}`));
    };

    // Load metadata only (faster than full download)
    audio.preload = "metadata";
    audio.src = url;
  });
};

/**
 * Preload a font using CSS Font Loading API
 *
 * @param fontFamily - Font family name
 * @param url - Font file URL
 * @returns Promise that resolves when font is loaded
 */
const preloadFont = (fontFamily: string, url: string): Promise<void> => {
  if ("fonts" in document) {
    const fontFace = new FontFace(fontFamily, `url(${url})`);
    return fontFace.load().then((loadedFace) => {
      document.fonts.add(loadedFace);
    });
  }

  // Fallback: create link element
  return new Promise((resolve) => {
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "font";
    link.type = "font/woff2";
    link.href = url;
    link.crossOrigin = "anonymous";
    link.onload = () => resolve();
    link.onerror = () => resolve(); // Don't block on font failures
    document.head.appendChild(link);
  });
};

/**
 * Generic resource preload using link[rel="preload"]
 *
 * @param resource - Resource metadata
 * @returns Promise that resolves when resource is preloaded
 */
const preloadGenericResource = (resource: ResourceMetadata): Promise<void> => {
  return new Promise((resolve, reject) => {
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = resource.type === "script" ? "script" : "fetch";
    link.href = resource.url;

    if (resource.crossOrigin) {
      link.crossOrigin = resource.crossOrigin;
    }

    link.onload = () => resolve();
    link.onerror = () =>
      reject(new Error(`Failed to preload: ${resource.url}`));

    document.head.appendChild(link);
  });
};

/**
 * Preload a single resource based on its type
 *
 * @param resource - Resource metadata
 * @returns Promise that resolves when resource is loaded
 */
const preloadResource = async (resource: ResourceMetadata): Promise<void> => {
  try {
    switch (resource.type) {
      case "image": {
        await preloadImage(resource.url);
        break;
      }
      case "audio": {
        await preloadAudio(resource.url);
        break;
      }
      case "font": {
        // Extract font family from URL or use default
        const fontFamily =
          resource.url.split("/").pop()?.split(".")[0] || "CustomFont";
        await preloadFont(fontFamily, resource.url);
        break;
      }
      default: {
        await preloadGenericResource(resource);
        break;
      }
    }
  } catch (error: unknown) {
    // Log error in development but don't throw (progressive enhancement)
    if (import.meta.env.DEV) {
      console.warn(
        `[ResourcePreloader] Failed to preload ${resource.url}:`,
        error,
      );
    }
    throw error;
  }
};

/**
 * Preload multiple resources with progress tracking
 *
 * @param resources - Array of resources to preload
 * @param onProgress - Optional callback for progress updates
 * @returns Promise that resolves with final progress state
 *
 * @example
 * ```typescript
 * const resources: ResourceMetadata[] = [
 *   { url: '/logo.png', type: 'image', priority: 'high' },
 *   { url: '/sounds/tap.wav', type: 'audio', priority: 'medium' }
 * ]
 *
 * await preloadResources(resources, (progress) => {
 *   console.log(`Loaded: ${progress.percentage}%`)
 * })
 * ```
 */
export const preloadResources = async (
  resources: ResourceMetadata[],
  onProgress?: (progress: PreloadProgress) => void,
): Promise<PreloadProgress> => {
  // Check bandwidth constraints
  if (isLimitedBandwidth()) {
    // Only preload high-priority resources on slow connections
    resources = resources.filter((r) => r.priority === "high");
  }

  // Sort by priority (high -> medium -> low)
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  const sortedResources = [...resources].sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority],
  );

  // Initialize progress tracking
  globalPreloadProgress = {
    total: sortedResources.length,
    loaded: 0,
    failed: 0,
    percentage: 0,
    failedResources: [],
  };

  // Preload resources with concurrency limit (max 6 concurrent)
  const concurrencyLimit = 6;
  const updateProgress = () => {
    globalPreloadProgress.percentage = Math.round(
      ((globalPreloadProgress.loaded + globalPreloadProgress.failed) /
        globalPreloadProgress.total) *
        100,
    );
    onProgress?.(globalPreloadProgress);
  };

  // Process resources in batches
  for (let i = 0; i < sortedResources.length; i += concurrencyLimit) {
    const batch = sortedResources.slice(i, i + concurrencyLimit);

    await Promise.allSettled(
      batch.map(async (resource) => {
        try {
          await preloadResource(resource);
          globalPreloadProgress.loaded++;
        } catch {
          globalPreloadProgress.failed++;
          globalPreloadProgress.failedResources.push(resource.url);
        }
        updateProgress();
      }),
    );
  }

  return globalPreloadProgress;
};

/**
 * Preload critical resources for game initialization
 * Focuses on high-priority assets needed for first meaningful paint
 *
 * @param priorities - Array of priority levels to preload (default: ['high'])
 * @returns Promise that resolves when preloading completes
 */
export const preloadCriticalResources = async (
  priorities: ResourcePriority[] = ["high"],
): Promise<PreloadProgress> => {
  // TODO: [OPTIMIZATION] Move resource definitions to external JSON config
  // This would allow dynamic resource management without code changes
  const criticalResources: ResourceMetadata[] = [
    // High priority - UI components
    {
      url: "/backgrounds/mountain-sunrise.jpg",
      type: "image",
      priority: "high",
    },
    // Audio files removed - now handled by welcome-audio-sequencer with speech fallback
    // See src/lib/audio/welcome-audio-sequencer.ts for audio handling

    // Low priority - Decorative
    { url: "/backgrounds/ocean-sunset.jpg", type: "image", priority: "low" },
    { url: "/backgrounds/forest-path.jpg", type: "image", priority: "low" },
  ];

  const resourcesToLoad = criticalResources.filter((r) =>
    priorities.includes(r.priority),
  );

  return preloadResources(resourcesToLoad, (progress) => {
    if (import.meta.env.DEV) {
      console.log(
        `[ResourcePreloader] Loading critical resources: ${progress.percentage}%`,
      );
    }
  });
};

/**
 * Get current preload progress
 *
 * @returns Current global preload progress state
 */
export const getPreloadProgress = (): PreloadProgress => {
  return { ...globalPreloadProgress };
};

/**
 * Reset preload progress tracking
 * Useful for re-initializing after route changes or errors
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
