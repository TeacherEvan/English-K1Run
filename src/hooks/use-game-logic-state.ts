import { useRef, useState } from "react";
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
    continuousModeStartTime,
    setContinuousModeStartTime,
    continuousModeHighScore,
    setContinuousModeHighScore,
  };
};
