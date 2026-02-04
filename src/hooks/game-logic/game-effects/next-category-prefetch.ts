import { useEffect } from "react";
import { GAME_CATEGORIES } from "../../../lib/constants/game-categories";
import { prefetchAudioKeys } from "../../../lib/sound-manager";

/**
 * Prefetches audio for the next category during gameplay.
 */
export const useNextCategoryPrefetch = (
  gameStarted: boolean,
  level: number,
  clampLevel: (levelIndex: number) => number,
) => {
  useEffect(() => {
    if (!gameStarted) return;

    const nextLevel = clampLevel(level + 1);
    const nextCategory = GAME_CATEGORIES[nextLevel];
    if (!nextCategory) return;

    const keys = nextCategory.items.map((item) => item.name);
    void prefetchAudioKeys(keys);
  }, [clampLevel, gameStarted, level]);
};
