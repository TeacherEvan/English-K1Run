import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import { useMemo } from "react";
import type {
  FairyTransformObject,
  GameCategory,
  GameObject,
  GameState,
  WormObject,
} from "../types/game";
import {
  createHandleObjectTap,
  createHandleWormTap,
} from "./game-logic/tap-handlers";

interface InteractionDeps {
  gameObjectsRef: MutableRefObject<GameObject[]>;
  gameState: GameState;
  currentCategory: GameCategory;
  reducedMotion: boolean;
  generateRandomTarget: (levelOverride?: number) => {
    name: string;
    emoji: string;
  };
  spawnImmediateTargets: () => void;
  continuousMode: boolean;
  continuousModeTargetCount: MutableRefObject<number>;
  continuousModeHighScore: number | null;
  continuousModeStartTime: number | null;
  setContinuousModeHighScore: Dispatch<SetStateAction<number | null>>;
  setContinuousModeStartTime: Dispatch<SetStateAction<number | null>>;
  refillTargetPool: (levelIndex?: number) => void;
  setGameState: Dispatch<SetStateAction<GameState>>;
  setScreenShake: Dispatch<SetStateAction<boolean>>;
  setGameObjects: Dispatch<SetStateAction<GameObject[]>>;
  setWorms: Dispatch<SetStateAction<WormObject[]>>;
  setFairyTransforms: Dispatch<SetStateAction<FairyTransformObject[]>>;
  wormSpeedMultiplier: MutableRefObject<number>;
}

/**
 * Builds interaction handlers for objects and worms.
 */
export const useGameLogicInteractions = ({
  gameObjectsRef,
  gameState,
  currentCategory,
  reducedMotion,
  generateRandomTarget,
  spawnImmediateTargets,
  continuousMode,
  continuousModeTargetCount,
  continuousModeHighScore,
  continuousModeStartTime,
  setContinuousModeHighScore,
  setContinuousModeStartTime,
  refillTargetPool,
  setGameState,
  setScreenShake,
  setGameObjects,
  setWorms,
  setFairyTransforms,
  wormSpeedMultiplier,
}: InteractionDeps) => {
  const handleObjectTap = useMemo(
    () =>
      createHandleObjectTap({
        gameObjectsRef,
        gameState,
        currentCategory,
        reducedMotion,
        generateRandomTarget,
        spawnImmediateTargets,
        continuousMode,
        continuousModeTargetCount,
        continuousModeHighScore,
        continuousModeStartTime,
        setContinuousModeHighScore,
        setContinuousModeStartTime,
        refillTargetPool,
        setGameState,
        setScreenShake,
        setGameObjects,
      }),
    [
      gameObjectsRef,
      gameState,
      currentCategory,
      reducedMotion,
      generateRandomTarget,
      spawnImmediateTargets,
      continuousMode,
      continuousModeTargetCount,
      continuousModeHighScore,
      continuousModeStartTime,
      setContinuousModeHighScore,
      setContinuousModeStartTime,
      refillTargetPool,
      setGameState,
      setScreenShake,
      setGameObjects,
    ],
  );

  const handleWormTap = useMemo(
    () =>
      createHandleWormTap({
        setWorms,
        setFairyTransforms,
        wormSpeedMultiplier,
      }),
    [setWorms, setFairyTransforms, wormSpeedMultiplier],
  );

  return { handleObjectTap, handleWormTap };
};
