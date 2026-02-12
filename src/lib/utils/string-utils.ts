/**
 * String formatting utilities
 */

/**
 * Generate a unique identifier with optional prefix
 */
export const generateUniqueIdentifier = (identifierPrefix = "id"): string => {
  const currentTimestamp = Date.now();
  const randomSuffix = Math.random().toString(36).slice(2, 8);
  return `${identifierPrefix}-${currentTimestamp}-${randomSuffix}`;
};

/**
 * Format milliseconds into a human-readable time string (MM:SS)
 */
export const formatMillisecondsAsMinutesSeconds = (
  totalMilliseconds: number
): string => {
  const totalSeconds = Math.floor(totalMilliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;

  const minutesFormatted = minutes.toString().padStart(2, "0");
  const secondsFormatted = remainingSeconds.toString().padStart(2, "0");

  return `${minutesFormatted}:${secondsFormatted}`;
};
