import { EMOJI_SIZE } from "../../lib/constants/game-config";
import type { GameObject, PlayerSide } from "../../types/game";

export const splitLaneObjects = (objects: GameObject[]) => {
  const leftLaneObjects: GameObject[] = [];
  const rightLaneObjects: GameObject[] = [];
  for (const obj of objects) {
    if (obj.lane === "left") {
      leftLaneObjects.push(obj);
    } else {
      rightLaneObjects.push(obj);
    }
  }
  return { leftLaneObjects, rightLaneObjects };
};

export const buildObject = (
  item: { emoji: string; name: string },
  lane: PlayerSide,
  spawnX: number,
  spawnY: number,
  fallSpeedMultiplier: number,
  idPrefix: string | null,
  index: number,
): GameObject => ({
  id: `${idPrefix ? `${idPrefix}-` : ""}${Date.now()}-${index}-${Math.random()
    .toString(36)
    .slice(2, 8)}`,
  type: item.name,
  emoji: item.emoji,
  x: spawnX,
  y: spawnY,
  speed: (Math.random() * 0.8 + 0.6) * fallSpeedMultiplier,
  size: EMOJI_SIZE,
  lane,
});
