import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import { useEffect } from "react";
import type { GameObject, WormObject } from "../../../types/game";
import { applyWormObjectCollision, updateWormPositions } from "../worm-logic";

/**
 * Runs the main animation loop for worms and falling objects.
 */
export const useAnimationLoop = (
  gameStarted: boolean,
  winner: boolean,
  updateObjects: () => void,
  setWorms: Dispatch<SetStateAction<WormObject[]>>,
  setGameObjects: Dispatch<SetStateAction<GameObject[]>>,
  viewportRef: MutableRefObject<{ width: number; height: number }>,
  wormSpeedMultiplier: MutableRefObject<number>,
  gameObjectsRef: MutableRefObject<GameObject[]>,
  wormsRef: MutableRefObject<WormObject[]>,
) => {
  useEffect(() => {
    if (!gameStarted || winner) {
      return;
    }

    let animationFrameId: number;
    let lastWormTime = performance.now();
    let lastObjectUpdateTime = performance.now();
    const targetFps = 60;
    const frameInterval = 1000 / targetFps;

    const animate = (currentTime: number) => {
      const dt = Math.min((currentTime - lastWormTime) / 16.67, 2);
      lastWormTime = currentTime;

      setWorms((prev) =>
        updateWormPositions(prev, dt, viewportRef, wormSpeedMultiplier),
      );

      const currentWorms = wormsRef.current;
      const currentObjects = gameObjectsRef.current;
      if (currentWorms.length > 0 && currentObjects.length > 0) {
        setGameObjects((prev) => {
          const updated = [...prev];
          applyWormObjectCollision(currentWorms, updated, { viewportRef });
          return updated;
        });
      }

      const elapsed = currentTime - lastObjectUpdateTime;
      if (elapsed >= frameInterval) {
        updateObjects();
        lastObjectUpdateTime = currentTime - (elapsed % frameInterval);
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [
    gameStarted,
    winner,
    updateObjects,
    setWorms,
    setGameObjects,
    viewportRef,
    wormSpeedMultiplier,
    gameObjectsRef,
    wormsRef,
  ]);
};
