import { useRef, useState } from "react";
import { GAME_CATEGORIES } from "../lib/constants/game-categories";
import type {
  FairyTransformObject,
  GameObject,
  GameState,
  WormObject,
} from "../types/game";

/**
 * Initializes state and refs used by the core game logic.
 */
export const useGameLogicState = () => {
  const [gameObjects, setGameObjects] = useState<GameObject[]>([]);
  const [worms, setWorms] = useState<WormObject[]>([]);
  const [fairyTransforms, setFairyTransforms] = useState<
    FairyTransformObject[]
  >([]);
  const [screenShake, setScreenShake] = useState(false);
  const [gameState, setGameState] = useState<GameState>(() => ({
    progress: 0,
    currentTarget: "",
    targetEmoji: "",
    level: 0,
    gameStarted: false,
    winner: false,
    targetChangeTime: 0,
    streak: 0,
    announcementActive: false,
    announcementEmoji: "",
    announcementSentence: "",
    multiplier: 1.0,
    lastMilestone: 0,
  }));

  const continuousModeTargetCount = useRef(0);
  const [continuousModeStartTime, setContinuousModeStartTime] = useState<
    number | null
  >(null);

  // Per-session sequence cursor for sequence-based categories. Lives in a ref
  // (not on the frozen GAME_CATEGORIES constant) so sessions never share state.
  const sequenceIndicesRef = useRef<number[]>(
    new Array(GAME_CATEGORIES.length).fill(0),
  );
  const [continuousModeHighScore, setContinuousModeHighScore] = useState<
    number | null
  >(() => {
    if (typeof localStorage === "undefined") return null;
    const stored = localStorage.getItem("continuousModeHighScore");
    return stored ? parseInt(stored, 10) : null;
  });

  return {
    gameObjects,
    setGameObjects,
    worms,
    setWorms,
    fairyTransforms,
    setFairyTransforms,
    screenShake,
    setScreenShake,
    gameState,
    setGameState,
    continuousModeTargetCount,
    sequenceIndicesRef,
    continuousModeStartTime,
    setContinuousModeStartTime,
    continuousModeHighScore,
    setContinuousModeHighScore,
  };
};
