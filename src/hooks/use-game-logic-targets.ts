import type { MutableRefObject } from "react";
import { useCallback, useMemo } from "react";
import { GAME_CATEGORIES } from "../lib/constants/game-categories";
import { createTargetPoolManager } from "./game-logic/target-pool";

interface TargetPoolRefs {
  targetPool: MutableRefObject<Array<{ emoji: string; name: string }>>;
  gameStateRef: MutableRefObject<{ level: number }>;
  gameStateLevel: number;
}

/**
 * Manages target pool generation and current category.
 */
export const useGameLogicTargets = ({
  targetPool,
  gameStateRef,
  gameStateLevel,
}: TargetPoolRefs) => {
  const clampLevel = useCallback((levelIndex: number) => {
    if (Number.isNaN(levelIndex)) return 0;
    return Math.max(0, Math.min(levelIndex, GAME_CATEGORIES.length - 1));
  }, []);

  const { generateRandomTarget, refillTargetPool } = useMemo(
    () =>
      createTargetPoolManager({
        targetPoolRef: targetPool,
        clampLevel,
        getLevel: () => gameStateRef.current.level,
      }),
    [clampLevel, gameStateRef, targetPool],
  );

  const currentCategory = useMemo(
    () => GAME_CATEGORIES[gameStateLevel] || GAME_CATEGORIES[0],
    [gameStateLevel],
  );

  return {
    clampLevel,
    currentCategory,
    generateRandomTarget,
    refillTargetPool,
  };
};
