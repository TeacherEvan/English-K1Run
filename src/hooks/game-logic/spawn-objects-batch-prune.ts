import { TARGET_GUARANTEE_COUNT } from "../../lib/constants/game-config";
import type { GameObject } from "../../types/game";

/**
 * Runs the existing overflow pruning calculation without mutating the list.
 */
export const runOverflowPruneCheck = (
  workingList: GameObject[],
  currentTarget: string,
  maxObjectsBeforeSpawn: number,
) => {
  const targetEmoji = currentTarget;
  let targetCountOnScreen = 0;
  let removedCount = 0;

  const screenHeight =
    typeof window !== "undefined" ? window.innerHeight : 1080;
  const offScreenThreshold = screenHeight * 0.8;

  const candidates: Array<{ id: string; y: number; isTarget: boolean }> = [];
  for (const obj of workingList) {
    const isTarget = !!(targetEmoji && obj.emoji === targetEmoji);
    if (isTarget) targetCountOnScreen++;
    if (obj.y >= offScreenThreshold) {
      candidates.push({ id: obj.id, y: obj.y, isTarget });
    }
  }

  candidates.sort((a, b) => b.y - a.y);

  for (const candidate of candidates) {
    if (workingList.length - removedCount <= maxObjectsBeforeSpawn) {
      break;
    }

    if (candidate.isTarget && targetCountOnScreen <= TARGET_GUARANTEE_COUNT) {
      continue;
    }

    if (candidate.isTarget) {
      targetCountOnScreen--;
    }
    removedCount++;
  }
};
