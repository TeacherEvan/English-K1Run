/**
 * Array manipulation utilities
 */

/**
 * Transform an array into a randomly shuffled copy using Fisher-Yates algorithm
 */
export const transformArrayToRandomOrder = <ElementType>(
  sourceArray: ElementType[]
): ElementType[] => {
  const shuffledCopy = [...sourceArray];

  // Fisher-Yates shuffle algorithm for uniform distribution
  for (let currentIndex = shuffledCopy.length - 1; currentIndex > 0; currentIndex--) {
    const randomIndex = Math.floor(Math.random() * (currentIndex + 1));
    // Swap elements using array destructuring
    [shuffledCopy[currentIndex], shuffledCopy[randomIndex]] = [
      shuffledCopy[randomIndex],
      shuffledCopy[currentIndex],
    ];
  }

  return shuffledCopy;
};
