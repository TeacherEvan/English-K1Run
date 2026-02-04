import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import type { GameObject, GameState } from "../../types/game";

/**
 * Shared dependencies for object spawning helpers.
 */
export interface SpawnDependencies {
  setGameObjects: Dispatch<SetStateAction<GameObject[]>>;
  fallSpeedMultiplier: number;
  gameStateRef: MutableRefObject<GameState>;
  lastEmojiAppearance: MutableRefObject<Map<string, number>>;
  lastTargetSpawnTime: MutableRefObject<number>;
  staleEmojisCache: MutableRefObject<{
    emojis: Array<{ emoji: string; name: string }>;
    timestamp: number;
  }>;
}
