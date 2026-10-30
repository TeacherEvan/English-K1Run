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
    const collisionContext = { viewportRef };

    /*
     * The loop owns its own authoritative worm array, seeded once from the ref.
     *
     * Reading `wormsRef.current` straight after dispatching `setWorms` returned
     * the PREVIOUS commit, because useSyncedRef assigns inside an effect and
     * effects run after paint. Collision therefore resolved against last
     * frame's worm positions — an error that scales with frame time, so it is
     * twice as far at 30 fps as at 60 and reproduces on classroom tablets but
     * not on a developer desktop.
     */
    let liveWorms = wormsRef.current;

    const animate = (currentTime: number) => {
      const dt = Math.min((currentTime - lastWormTime) / 16.67, 2);
      lastWormTime = currentTime;

      const nextWorms = updateWormPositions(
        liveWorms,
        dt,
        viewportRef,
        wormSpeedMultiplier,
      );

      // updateWormPositions returns the same reference when there is nothing to
      // move, so this skips a dispatch every frame on an empty board.
      if (nextWorms !== liveWorms) {
        liveWorms = nextWorms;
        setWorms(nextWorms);
      }

      if (nextWorms.length > 0) {
        // `prev` is the committed object list; the worm positions are the ones
        // this frame just computed, not the ones from the previous commit.
        setGameObjects((prev) =>
          applyWormObjectCollision(nextWorms, prev, collisionContext),
        );
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
    wormsRef,
  ]);
};
