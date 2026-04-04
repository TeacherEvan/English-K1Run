export const createContinuousModeLevelQueue = (
  selectedLevel: number,
  totalLevels: number,
): number[] => {
  if (totalLevels <= 0) return [];

  return Array.from(
    { length: totalLevels },
    (_value, index) => (selectedLevel + index) % totalLevels,
  );
};
