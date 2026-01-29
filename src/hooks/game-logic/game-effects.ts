/**
 * Game Effects Hooks
 */

import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import { useEffect } from "react";
import { GAME_CATEGORIES } from "../../lib/constants/game-categories";
import { FAIRY_TRANSFORM_DURATION } from "../../lib/constants/game-config";
import { playSoundEffect, prefetchAudioKeys } from "../../lib/sound-manager";
import type {
  FairyTransformObject,
  GameObject,
  WormObject,
} from "../../types/game";
import { applyWormObjectCollision, updateWormPositions } from "./worm-logic";

export const useViewportObserver = (
  viewportRef: MutableRefObject<{ width: number; height: number }>,
  onResize?: () => void,
) => {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateViewport = () => {
      viewportRef.current.width = window.innerWidth;
      viewportRef.current.height = window.innerHeight;
      // Call optional resize callback in the same tick to prevent race conditions
      // with CSS variable updates (prevents layout thrashing)
      onResize?.();
    };

    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, [viewportRef, onResize]);
};

export const useTargetAnnouncement = (
  gameStarted: boolean,
  currentTarget: string,
) => {
  useEffect(() => {
    if (gameStarted && currentTarget) {
      void playSoundEffect.voice(currentTarget);
    }
  }, [gameStarted, currentTarget]);
};

export const useNextCategoryPrefetch = (
  gameStarted: boolean,
  level: number,
  clampLevel: (levelIndex: number) => number,
) => {
  useEffect(() => {
    if (!gameStarted) return;

    const nextLevel = clampLevel(level + 1);
    const nextCategory = GAME_CATEGORIES[nextLevel];
    if (!nextCategory) return;

    const keys = nextCategory.items.map((item) => item.name);
    void prefetchAudioKeys(keys);
  }, [clampLevel, gameStarted, level]);
};

export const useSpawnInterval = (
  gameStarted: boolean,
  winner: boolean,
  spawnObject: () => void,
) => {
  useEffect(() => {
    if (!gameStarted || winner) {
      return;
    }

    const interval = setInterval(spawnObject, 1500);
    return () => clearInterval(interval);
  }, [gameStarted, winner, spawnObject]);
};

export const useAnimationLoop = (
  gameStarted: boolean,
  winner: boolean,
  updateObjects: () => void,
  setWorms: Dispatch<SetStateAction<WormObject[]>>,
  viewportRef: MutableRefObject<{ width: number; height: number }>,
  wormSpeedMultiplier: MutableRefObject<number>,
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
    viewportRef,
    wormSpeedMultiplier,
  ]);
};

export const useCollisionLoop = (
  gameStarted: boolean,
  winner: boolean,
  wormsRef: MutableRefObject<WormObject[]>,
  gameObjectsRef: MutableRefObject<GameObject[]>,
  setGameObjects: Dispatch<SetStateAction<GameObject[]>>,
  viewportRef: MutableRefObject<{ width: number; height: number }>,
) => {
  useEffect(() => {
    if (!gameStarted || winner) {
      return;
    }

    let collisionFrameId: number;
    let lastCollisionTime = 0;
    const collisionInterval = 1000 / 30;

    const applyCollisions = (currentTime: number) => {
      const elapsed = currentTime - lastCollisionTime;

      if (elapsed >= collisionInterval) {
        const currentWorms = wormsRef.current;
        const currentObjects = gameObjectsRef.current;

        if (currentWorms.length > 0 && currentObjects.length > 0) {
          setGameObjects((prev) => {
            const updated = [...prev];
            applyWormObjectCollision(currentWorms, updated, { viewportRef });
            return updated;
          });
        }

        lastCollisionTime = currentTime - (elapsed % collisionInterval);
      }

      collisionFrameId = requestAnimationFrame(applyCollisions);
    };

    collisionFrameId = requestAnimationFrame(applyCollisions);
    return () => cancelAnimationFrame(collisionFrameId);
  }, [
    gameStarted,
    winner,
    wormsRef,
    gameObjectsRef,
    setGameObjects,
    viewportRef,
  ]);
};

export const useFairyCleanup = (
  gameStarted: boolean,
  winner: boolean,
  setFairyTransforms: Dispatch<SetStateAction<FairyTransformObject[]>>,
) => {
  useEffect(() => {
    if (!gameStarted || winner) return;

    const interval = setInterval(() => {
      const now = Date.now();
      setFairyTransforms((prev) =>
        prev.filter(
          (fairy) => now - fairy.createdAt < FAIRY_TRANSFORM_DURATION,
        ),
      );
    }, 50);

    return () => clearInterval(interval);
  }, [gameStarted, winner, setFairyTransforms]);
};
