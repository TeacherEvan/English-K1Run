/**
 * Background image preloader for optimizing Core Web Vitals.
 * Lazily loads background images to improve LCP and reduce initial bundle size.
 */

import { useEffect, useState } from 'react';

// Map CSS class names to their background image URLs
const BACKGROUND_IMAGE_MAP: Record<string, string> = {
  'app-bg-mountain-sunrise': '/mountain-landscape.jpg',
  'app-bg-ocean-sunset': '/ocean-view.jpg',
  'app-bg-forest-path': '/meadow-flowers.jpg',
  'app-bg-lavender-field': '/meadow-flowers.jpg', // Reuse similar image
  'app-bg-aurora-night': '/starry-night.jpg',
  'app-bg-nebula-galaxy': '/Gemini_Generated_Image_895eeq895eeq895e.png',
  'app-bg-tropical-waterfall': '/meadow-flowers.jpg', // Placeholder
  'app-bg-colorful-buildings': '/welcome-sangsom.png', // Placeholder
  'app-bg-cherry-blossom': '/meadow-flowers.jpg', // Placeholder
  'app-bg-starry-art': '/starry-night.jpg' // Reuse
};

// Cache for loaded images
const loadedImages = new Set<string>();

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
export async function preloadBackgroundImages(classNames: string[], concurrency = 2): Promise<void> {
  const toLoad = classNames.filter(name => !loadedImages.has(name));

  if (toLoad.length === 0) return;

  // Load in batches to avoid overwhelming the network
  for (let i = 0; i < toLoad.length; i += concurrency) {
    const batch = toLoad.slice(i, i + concurrency);
    await Promise.allSettled(batch.map(preloadBackgroundImage));
  }
}

/**
 * Hook to lazily preload background images when they become likely to be used
 */
export function useLazyBackgroundPreloader() {
  const [isPreloading, setIsPreloading] = useState(false);

  useEffect(() => {
    // Preload critical backgrounds immediately (welcome screen)
    const criticalBackgrounds = [
      'app-bg-mountain-sunrise',
      'app-bg-ocean-sunset',
      'app-bg-forest-path'
    ];

    preloadBackgroundImages(criticalBackgrounds).catch(console.warn);

    // Preload remaining backgrounds after a delay to prioritize initial load
    const timer = setTimeout(() => {
      setIsPreloading(true);
      const allBackgrounds = Object.keys(BACKGROUND_IMAGE_MAP);
      const remaining = allBackgrounds.filter(bg => !criticalBackgrounds.includes(bg));

      preloadBackgroundImages(remaining, 1).catch(console.warn).finally(() => {
        setIsPreloading(false);
      });
    }, 2000); // 2 seconds after mount

    return () => clearTimeout(timer);
  }, []);

  return { isPreloading };
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
export function getBackgroundLoadingProgress(): { loaded: number; total: number } {
  const total = Object.keys(BACKGROUND_IMAGE_MAP).length;
  const loaded = loadedImages.size;
  return { loaded, total };
}