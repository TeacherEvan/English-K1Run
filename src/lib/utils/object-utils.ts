/**
 * Object manipulation utilities
 */

/**
 * Deep clone an object or array using structured cloning
 */
export const createDeepClone = <DataStructure>(
  sourceData: DataStructure
): DataStructure => {
  // Use structured clone API for reliable deep cloning (available in modern browsers)
  if (typeof structuredClone !== "undefined") {
    return structuredClone(sourceData);
  }

  // Fallback: JSON serialization (limitations with functions, dates, etc.)
  return JSON.parse(JSON.stringify(sourceData)) as DataStructure;
};
