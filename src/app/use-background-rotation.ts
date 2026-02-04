import type { Dispatch, SetStateAction } from "react";
import { useEffect } from "react";
import { pickRandomBackground } from "./backgrounds";

/**
 * Rotates backgrounds while gameplay is idle.
 */
export const useBackgroundRotation = (
  gameStarted: boolean,
  winner: boolean,
  setBackgroundClass: Dispatch<SetStateAction<string>>,
) => {
  useEffect(() => {
    if (gameStarted && !winner) {
      return;
    }

    const interval = setInterval(() => {
      setBackgroundClass((prev) => pickRandomBackground(prev));
    }, 20000);

    return () => clearInterval(interval);
  }, [gameStarted, winner, setBackgroundClass]);
};
