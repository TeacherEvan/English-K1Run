/**
 * Check if user prefers reduced motion
 * Respects accessibility preferences for animations
 */
export const userPrefersReducedMotion = (): boolean => {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

/**
 * Check if user prefers reduced data usage
 * Useful for optimizing resource loading
 */
export const userPrefersReducedData = (): boolean => {
  return window.matchMedia("(prefers-reduced-data: reduce)").matches;
};

/**
 * Check if user prefers dark color scheme
 * Respects system-level color scheme preference
 */
export const userPrefersDarkMode = (): boolean => {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

/**
 * Check if user prefers high contrast
 * Important for accessibility compliance
 */
export const userPrefersHighContrast = (): boolean => {
  return window.matchMedia("(prefers-contrast: high)").matches;
};
