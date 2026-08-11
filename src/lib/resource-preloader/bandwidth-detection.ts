/**
 * Bandwidth detection utilities
 */

/**
 * Check if user has limited bandwidth
 */
export const isLimitedBandwidth = (): boolean => {
  // Check for data-saver preference
  if ("connection" in navigator) {
    const connection = (navigator as { connection?: { saveData?: boolean } })
      .connection;
    if (connection?.saveData) {
      return true;
    }
  }

  // Check for slow connection types
  if ("connection" in navigator) {
    const connection = (
      navigator as { connection?: { effectiveType?: string } }
    ).connection;
    const slowTypes = ["slow-2g", "2g", "3g"];
    if (
      connection?.effectiveType &&
      slowTypes.includes(connection.effectiveType)
    ) {
      return true;
    }
  }

  return false;
};
