import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import { GAME_CATEGORIES } from "../../lib/constants/game-categories";
import type {
  FairyTransformObject,
  GameObject,
  GameState,
  PlayerSide,
  WormObject,
} from "../../types/game";

/**
 * Dependencies for the object tap handler.
 */
export interface HandleObjectTapDependencies {
  gameObjectsRef: MutableRefObject<GameObject[]>;
  gameState: GameState;
  currentCategory: (typeof GAME_CATEGORIES)[number];
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
}

/**
 * Dependencies for the worm tap handler.
 */
export interface HandleWormTapDependencies {
  setWorms: Dispatch<SetStateAction<WormObject[]>>;
  setFairyTransforms: Dispatch<SetStateAction<FairyTransformObject[]>>;
  wormSpeedMultiplier: MutableRefObject<number>;
  onWormTapped?: (wormId: string, playerSide: PlayerSide) => void;
}
