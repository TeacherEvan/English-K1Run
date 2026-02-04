import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import type {
  FairyTransformObject,
  GameObject,
  GameState,
  WormObject,
} from "../../types/game";

/**
 * Dependencies for game session handlers.
 */
export interface GameSessionDependencies {
  clampLevel: (levelIndex: number) => number;
  gameStateLevel: number;
  continuousMode: boolean;
  generateRandomTarget: (levelOverride?: number) => {
    name: string;
    emoji: string;
  };
  spawnImmediateTargets: () => void;
  lastEmojiAppearance: MutableRefObject<Map<string, number>>;
  targetPool: MutableRefObject<Array<{ emoji: string; name: string }>>;
  continuousModeTargetCount: MutableRefObject<number>;
  progressiveSpawnTimeoutRefs: MutableRefObject<NodeJS.Timeout[]>;
  recurringSpawnIntervalRef: MutableRefObject<NodeJS.Timeout | undefined>;
  wormSpeedMultiplier: MutableRefObject<number>;
  setContinuousModeStartTime: Dispatch<SetStateAction<number | null>>;
  setGameObjects: Dispatch<SetStateAction<GameObject[]>>;
  setWorms: Dispatch<SetStateAction<WormObject[]>>;
  setFairyTransforms: Dispatch<SetStateAction<FairyTransformObject[]>>;
  setScreenShake: Dispatch<SetStateAction<boolean>>;
  setGameState: Dispatch<SetStateAction<GameState>>;
}
