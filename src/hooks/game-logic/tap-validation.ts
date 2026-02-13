import { eventTracker } from "../../lib/event-tracker";
import type { GameObject, GameCategory } from "../../types/game";
import type { PlayerSide } from "../../types/game";

/**
 * Validates if a tapped object matches the current target.
 */
export interface ValidateTapResult {
  tappedObject: GameObject;
  isCorrect: boolean;
  tapLatency: number;
}

export const validateObjectTap = (
  objectId: string,
  playerSide: PlayerSide,
  gameObjects: GameObject[],
  currentTarget: string,
  targetEmoji: string,
  currentCategory: GameCategory,
  tapStartTime: number,
): ValidateTapResult | null => {
  const tappedObject = gameObjects.find((obj) => obj.id === objectId);

  if (!tappedObject) {
    eventTracker.trackWarning("Tapped object not found", {
      objectId,
      playerSide,
    });
    return null;
  }

  const isCorrect = currentCategory.requiresSequence
    ? tappedObject.type === currentTarget
    : tappedObject.emoji === targetEmoji;

  const tapLatency = performance.now() - tapStartTime;

  return {
    tappedObject,
    isCorrect,
    tapLatency,
  };
};
