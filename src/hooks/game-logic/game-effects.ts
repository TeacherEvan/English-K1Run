/**
 * Game Effects Hooks
 */

import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import { useEffect } from "react";
import { speechSynthesizer } from "../../lib/audio/speech-synthesizer";
import { getTargetSentence } from "../../lib/audio/target-announcements";
import { GAME_CATEGORIES } from "../../lib/constants/game-categories";
import { FAIRY_TRANSFORM_DURATION } from "../../lib/constants/game-config";
import { prefetchAudioKeys, soundManager } from "../../lib/sound-manager";
import type {
  FairyTransformObject,
  GameObject,
  GameState,
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const visual = (window as any).visualViewport;
      viewportRef.current.width = visual?.width ?? window.innerWidth;
      viewportRef.current.height = visual?.height ?? window.innerHeight;
      onResize?.();
    };

    updateViewport();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const visual = (window as any).visualViewport;
    if (visual && typeof visual.addEventListener === "function") {
      visual.addEventListener("resize", updateViewport);
    }
    window.addEventListener("resize", updateViewport);

    return () => {
      if (visual && typeof visual.removeEventListener === "function") {
        visual.removeEventListener("resize", updateViewport);
      }
      window.removeEventListener("resize", updateViewport);
    };
  }, [viewportRef, onResize]);
};

export const useTargetAnnouncement = (
  gameStarted: boolean,
  currentTarget: string,
  targetEmoji: string,
  setGameState: Dispatch<SetStateAction<GameState>>,
) => {
  useEffect(() => {
    if (!gameStarted) {
      setGameState((prev) => ({
        ...prev,
        announcementActive: false,
      }));
      return;
    }

    if (!currentTarget) return;

    let cancelled = false;
    const language = soundManager.getLanguage();

    const announceTarget = async () => {
      speechSynthesizer.stop();
      const sentence = getTargetSentence(currentTarget, language);
      if (cancelled) return;

      setGameState((prev) => ({
        ...prev,
        announcementActive: true,
        announcementEmoji: targetEmoji,
        announcementSentence: sentence,
      }));

      if (!sentence) {
        setGameState((prev) => ({
          ...prev,
          announcementActive: false,
        }));
        return;
      }

      await speechSynthesizer.speakAsync(sentence, { langCode: language });

      if (!cancelled) {
        setGameState((prev) => ({
          ...prev,
          announcementActive: false,
        }));
      }
    };

    void announceTarget();

    return () => {
      cancelled = true;
      speechSynthesizer.stop();
    };
  }, [currentTarget, gameStarted, setGameState, targetEmoji]);
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

      // Update worm positions
      setWorms((prev) =>
        updateWormPositions(prev, dt, viewportRef, wormSpeedMultiplier),
      );

      // Apply worm-object collision (synchronized with object updates)
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

// Removed useCollisionLoop - collision detection is now integrated into useAnimationLoop
// to prevent duplicate collision resolution that was causing scattered target positions

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
