import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import { useMemo } from "react";
import type { GameObject, GameState } from "../types/game";
import { createObjectUpdater } from "./game-logic/object-update";
import { createSpawnHandlers } from "./game-logic/spawn-objects";

interface SpawnDeps {
  setGameObjects: Dispatch<SetStateAction<GameObject[]>>;
  fallSpeedMultiplier: number;
  viewportRef: MutableRefObject<{ width: number; height: number }>;
  gameStateRef: MutableRefObject<GameState>;
  gameObjectsRef: MutableRefObject<GameObject[]>;
  positionsRef: MutableRefObject<Map<string, { x: number; y: number }>>;
  lastEmojiAppearance: MutableRefObject<Map<string, number>>;
  lastTargetSpawnTime: MutableRefObject<number>;
  staleEmojisCache: MutableRefObject<{
    emojis: Array<{ emoji: string; name: string }>;
    timestamp: number;
  }>;
}

/**
 * Creates spawners and object update handlers.
 */
export const useGameLogicSpawn = ({
  setGameObjects,
  fallSpeedMultiplier,
  viewportRef,
  gameStateRef,
  gameObjectsRef,
  positionsRef,
  lastEmojiAppearance,
  lastTargetSpawnTime,
  staleEmojisCache,
}: SpawnDeps) => {
  const { spawnImmediateTargets, spawnObject } = useMemo(
    () =>
      createSpawnHandlers({
        setGameObjects,
        fallSpeedMultiplier,
        gameStateRef,
        lastEmojiAppearance,
        lastTargetSpawnTime,
        staleEmojisCache,
      }),
    [
      setGameObjects,
      fallSpeedMultiplier,
      gameStateRef,
      lastEmojiAppearance,
      lastTargetSpawnTime,
      staleEmojisCache,
    ],
  );

  const { updateObjects } = useMemo(
    () =>
      createObjectUpdater({
        setGameObjects,
        viewportRef,
        gameStateRef,
        gameObjectsRef,
        positionsRef,
      }),
    [setGameObjects, viewportRef, gameStateRef, gameObjectsRef, positionsRef],
  );

  return { spawnImmediateTargets, spawnObject, updateObjects };
};
