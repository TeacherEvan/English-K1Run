/**
 * Target Visibility Helper
 */

import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import { eventTracker } from "../../lib/event-tracker";
import type { GameCategory, GameObject, GameState } from "../../types/game";

export interface TargetVisibilityDependencies {
  gameObjectsRef: MutableRefObject<GameObject[]>;
  gameStateRef: MutableRefObject<GameState>;
  currentCategory: GameCategory;
  setGameState: Dispatch<SetStateAction<GameState>>;
  spawnImmediateTargets: () => void;
}

export const createChangeTargetToVisibleEmoji = (
  dependencies: TargetVisibilityDependencies,
) => {
  const {
    gameObjectsRef,
    gameStateRef,
    currentCategory,
    setGameState,
    spawnImmediateTargets,
  } = dependencies;

  return () => {
    try {
      const visibleEmojis = new Set<string>();
      for (const obj of gameObjectsRef.current) {
        visibleEmojis.add(obj.emoji);
      }

      const availableEmojis = Array.from(visibleEmojis).filter(
        (emoji) => emoji !== gameStateRef.current.targetEmoji,
      );

      if (availableEmojis.length === 0) {
        if (import.meta.env.DEV) {
          console.log("[TargetDisplay] No other visible emojis to switch to");
        }
        return;
      }

      const randomEmoji =
        availableEmojis[Math.floor(Math.random() * availableEmojis.length)];

      const targetItem = currentCategory.items.find(
        (item) => item.emoji === randomEmoji,
      );

      if (!targetItem) {
        if (import.meta.env.DEV) {
          console.log(
            "[TargetDisplay] Could not find item for emoji:",
            randomEmoji,
          );
        }
        return;
      }

      setGameState((prev) => {
        const newState = {
          ...prev,
          currentTarget: targetItem.name,
          targetEmoji: targetItem.emoji,
          targetChangeTime: Date.now() + 10000,
        };
        eventTracker.trackGameStateChange(
          { ...prev },
          { ...newState },
          "manual_target_change_via_click",
        );
        return newState;
      });

      setTimeout(() => spawnImmediateTargets(), 0);

      if (import.meta.env.DEV) {
        console.log("[TargetDisplay] Changed target to:", targetItem.name);
      }
    } catch (error) {
      eventTracker.trackError(error as Error, "changeTargetToVisibleEmoji");
    }
  };
};
