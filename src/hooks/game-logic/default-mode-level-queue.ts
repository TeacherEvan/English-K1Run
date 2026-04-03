export const createDefaultModeLevelQueue = (
  selectedLevel: number,
  levelCount: number,
  random: () => number = Math.random,
): number[] => {
  if (levelCount <= 1) {
    return [0];
  }

  const safeSelectedLevel = Math.min(
    Math.max(selectedLevel, 0),
    levelCount - 1,
  );
  const remainingLevels = Array.from(
    { length: levelCount },
    (_, index) => index,
  ).filter((index) => index !== safeSelectedLevel);

  for (let index = remainingLevels.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [remainingLevels[index], remainingLevels[swapIndex]] = [
      remainingLevels[swapIndex],
      remainingLevels[index],
    ];
  }

  return [safeSelectedLevel, ...remainingLevels];
};
