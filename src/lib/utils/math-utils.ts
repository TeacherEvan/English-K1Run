/**
 * Mathematical utility functions
 */

/**
 * Calculate a clamped percentage value within specified bounds
 */
export const calculatePercentageWithinBounds = (
  currentValue: number,
  minimumBound: number,
  maximumBound: number
): number => {
  return Math.min(maximumBound, Math.max(minimumBound, currentValue));
};

/**
 * Validate if a numeric value falls within a specified range
 */
export const validateNumericRange = (
  valueToCheck: number,
  minimumAllowed: number,
  maximumAllowed: number
): boolean => {
  return valueToCheck >= minimumAllowed && valueToCheck <= maximumAllowed;
};

/**
 * Calculate the Euclidean distance between two points in 2D space
 */
export const calculateDistanceBetweenPoints = (
  firstPointX: number,
  firstPointY: number,
  secondPointX: number,
  secondPointY: number
): number => {
  const deltaX = secondPointX - firstPointX;
  const deltaY = secondPointY - firstPointY;
  return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
};

/**
 * Determine if two circular objects are colliding
 */
export const determineCircularCollision = (
  firstObjectX: number,
  firstObjectY: number,
  firstObjectRadius: number,
  secondObjectX: number,
  secondObjectY: number,
  secondObjectRadius: number
): boolean => {
  const distance = calculateDistanceBetweenPoints(
    firstObjectX,
    firstObjectY,
    secondObjectX,
    secondObjectY
  );
  const combinedRadii = firstObjectRadius + secondObjectRadius;
  return distance < combinedRadii;
};

/**
 * Calculate percentage completion from current and target values
 */
export const calculatePercentageCompletion = (
  currentProgress: number,
  targetGoal: number,
  decimalPlaces = 0
): number => {
  if (targetGoal === 0) return 0;

  const rawPercentage = (currentProgress / targetGoal) * 100;
  const clampedPercentage = calculatePercentageWithinBounds(rawPercentage, 0, 100);

  return Number(clampedPercentage.toFixed(decimalPlaces));
};

/**
 * Generate a random number within a specified range (inclusive)
 */
export const generateRandomNumberInRange = (
  minimumValue: number,
  maximumValue: number
): number => {
  return Math.random() * (maximumValue - minimumValue) + minimumValue;
};

/**
 * Generate a random integer within a specified range (inclusive)
 */
export const generateRandomIntegerInRange = (
  minimumValue: number,
  maximumValue: number
): number => {
  return Math.floor(generateRandomNumberInRange(minimumValue, maximumValue + 1));
};
