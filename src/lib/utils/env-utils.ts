/**
 * Environment detection utilities
 */

/**
 * Check if the code is running in development mode
 */
export const isRunningInDevelopmentMode = (): boolean => {
  return import.meta.env.DEV;
};

/**
 * Check if the code is running in production mode
 */
export const isRunningInProductionMode = (): boolean => {
  return import.meta.env.MODE === "production";
};
