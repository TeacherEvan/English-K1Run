/**
 * Target Pool Helpers
 *
 * Manages target selection to avoid repeats until all items are used.
 */

import type { MutableRefObject } from "react";
import { GAME_CATEGORIES } from "../../lib/constants/game-categories";
import type { GameCategory } from "../../types/game";

export interface TargetPoolManager {
  generateRandomTarget: (levelOverride?: number) => {
    name: string;
    emoji: string;
  };
  refillTargetPool: (levelIndex?: number) => void;
}

export interface TargetPoolDependencies {
  targetPoolRef: MutableRefObject<Array<{ emoji: string; name: string }>>;
  clampLevel: (levelIndex: number) => number;
  getLevel: () => number;
}

const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const getCategory = (levelIndex: number): GameCategory =>
  GAME_CATEGORIES[levelIndex] || GAME_CATEGORIES[0];

export const createTargetPoolManager = (
  dependencies: TargetPoolDependencies,
): TargetPoolManager => {
  const { targetPoolRef, clampLevel, getLevel } = dependencies;

  const refillTargetPool = (levelIndex?: number) => {
    const level = levelIndex !== undefined ? levelIndex : getLevel();
    const safeLevel = clampLevel(level);
    const category = getCategory(safeLevel);
    targetPoolRef.current = shuffleArray(category.items);
  };

  const generateRandomTarget = (levelOverride?: number) => {
    const levelIndex = clampLevel(levelOverride ?? getLevel());
    const category = getCategory(levelIndex);

    if (category.requiresSequence) {
      const sequenceIndex = category.sequenceIndex || 0;
      const targetItem = category.items[sequenceIndex % category.items.length];
      return { name: targetItem.name, emoji: targetItem.emoji };
    }

    if (targetPoolRef.current.length === 0) {
      refillTargetPool(levelIndex);
    }

    const targetItem = targetPoolRef.current.pop();
    if (!targetItem) {
      const fallback = category.items[0];
      return { name: fallback.name, emoji: fallback.emoji };
    }

    return { name: targetItem.name, emoji: targetItem.emoji };
  };

  return { generateRandomTarget, refillTargetPool };
};
