import {
  FAIRY_VISUAL_CONSTANTS,
  getRandomIntenseColorPalette,
} from "../../lib/constants/fairy-animations";
import type { OrbitSparkle } from "./types";

/**
 * Build orbiting sparkle metadata with a consistent random palette.
 */
export const createOrbitingSparkles = (): OrbitSparkle[] => {
  const colorPalette = getRandomIntenseColorPalette();
  return Array.from(
    { length: FAIRY_VISUAL_CONSTANTS.SPARKLE_COUNT },
    (_, i) => ({
      id: i,
      angle: (Math.PI * 2 * i) / FAIRY_VISUAL_CONSTANTS.SPARKLE_COUNT,
      distance: 40 + Math.random() * 20,
      speed: 0.5 + Math.random() * 0.5,
      size: 8 + Math.random() * 8,
      color: colorPalette[Math.floor(Math.random() * colorPalette.length)],
    }),
  );
};
