import { useEffect, useMemo, useRef, useState } from "react";
import type { FairyTransformObject } from "../../hooks/use-game-logic";
import {
  FAIRY_ANIMATION_TIMING,
  FAIRY_VISUAL_CONSTANTS,
  calculateFairyFadeIn,
  calculateGlowIntensity,
  calculateMorphScale,
  calculateWormOpacity,
  easeOutCubic,
  generateBezierControl,
  generateFlyTarget,
  getRandomIntenseColorPalette,
  quadraticBezier,
} from "../../lib/constants/fairy-animations";
import { createOrbitingSparkles } from "./sparkle-utils";
import type { OrbitSparkle, TrailSparkle } from "./types";

export type FairyPhase = "morphing" | "flying" | "trail-fading";

interface FairyAnimationState {
  age: number;
  phase: FairyPhase;
  fairyPos: { x: number; y: number };
  orbitingSparkles: OrbitSparkle[];
  trailSparkles: TrailSparkle[];
  colorPalette: readonly string[];
  morphProgress: number;
  fairyOpacity: number;
  wormOpacity: number;
  fairyFadeIn: number;
  morphScale: number;
  glowIntensity: number;
  isVisible: boolean;
}

/**
 * Drives time-based animation state for fairy transformations.
 */
export const useFairyAnimation = (
  fairy: FairyTransformObject,
): FairyAnimationState => {
  const [now, setNow] = useState(() => Date.now());
  const [trailSparkles, setTrailSparkles] = useState<TrailSparkle[]>([]);
  const sparkleIdRef = useRef(0);
  const frameCountRef = useRef(0);

  const [orbitingSparkles] = useState<OrbitSparkle[]>(() =>
    createOrbitingSparkles(),
  );
  const [colorPalette] = useState<readonly string[]>(() =>
    getRandomIntenseColorPalette(),
  );
  const [flyTarget] = useState(() => generateFlyTarget(fairy.x, fairy.y));
  const [bezierControl] = useState(() =>
    generateBezierControl(fairy.x, fairy.y, flyTarget.x, flyTarget.y),
  );

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log(
        `[FairyTransformation] Rendering at x=${fairy.x}%, y=${fairy.y}px, lane=${fairy.lane}`,
      );
    }
  }, [fairy.x, fairy.y, fairy.lane]);

  const age = now - fairy.createdAt;

  const phase = useMemo<FairyPhase>(() => {
    if (age < FAIRY_ANIMATION_TIMING.MORPH_DURATION) return "morphing";
    if (
      age <
      FAIRY_ANIMATION_TIMING.MORPH_DURATION +
        FAIRY_ANIMATION_TIMING.FLY_DURATION
    ) {
      return "flying";
    }
    return "trail-fading";
  }, [age]);

  const fairyPos = useMemo(() => {
    if (phase !== "flying") return { x: fairy.x, y: fairy.y };

    const flyStartTime =
      fairy.createdAt + FAIRY_ANIMATION_TIMING.MORPH_DURATION;
    const flyAge = now - flyStartTime;
    const progress = Math.min(1, flyAge / FAIRY_ANIMATION_TIMING.FLY_DURATION);
    const easedProgress = easeOutCubic(progress);

    return {
      x: quadraticBezier(easedProgress, fairy.x, bezierControl.x, flyTarget.x),
      y: quadraticBezier(easedProgress, fairy.y, bezierControl.y, flyTarget.y),
    };
  }, [phase, now, fairy.createdAt, fairy.x, fairy.y, flyTarget, bezierControl]);

  useEffect(() => {
    let animationFrameId: number;
    let lastUpdateTime = 0;
    let startTime = 0;

    const animate = (currentNow: number) => {
      if (startTime === 0) {
        startTime = currentNow - (Date.now() - fairy.createdAt);
      }

      frameCountRef.current++;
      const timeSinceLastUpdate = currentNow - lastUpdateTime;
      if (timeSinceLastUpdate >= FAIRY_ANIMATION_TIMING.UPDATE_INTERVAL) {
        lastUpdateTime = currentNow;
        setNow(Date.now());
      }

      const currentAge = currentNow - startTime;
      const currentPhase: "morphing" | "flying" | "trail-fading" =
        currentAge < FAIRY_ANIMATION_TIMING.MORPH_DURATION
          ? "morphing"
          : currentAge <
              FAIRY_ANIMATION_TIMING.MORPH_DURATION +
                FAIRY_ANIMATION_TIMING.FLY_DURATION
            ? "flying"
            : "trail-fading";

      const shouldSpawnNew =
        currentPhase === "flying" &&
        frameCountRef.current %
          FAIRY_VISUAL_CONSTANTS.TRAIL_SPAWN_FRAME_INTERVAL ===
          0;

      if (currentPhase === "flying" || currentPhase === "trail-fading") {
        setTrailSparkles((prev) => {
          if (prev.length === 0 && !shouldSpawnNew) return prev;

          const faded = prev
            .map((s) => ({ ...s, opacity: s.opacity - 0.015, y: s.y + 0.5 }))
            .filter((s) => s.opacity > 0);

          if (shouldSpawnNew) {
            const flyStartTimeLocal = FAIRY_ANIMATION_TIMING.MORPH_DURATION;
            const flyAge = currentAge - flyStartTimeLocal;
            const progress = Math.min(
              1,
              flyAge / FAIRY_ANIMATION_TIMING.FLY_DURATION,
            );
            const easedProgress = easeOutCubic(progress);

            const currentX = quadraticBezier(
              easedProgress,
              fairy.x,
              bezierControl.x,
              flyTarget.x,
            );
            const currentY = quadraticBezier(
              easedProgress,
              fairy.y,
              bezierControl.y,
              flyTarget.y,
            );

            const newSparkle: TrailSparkle = {
              id: sparkleIdRef.current++,
              x: currentX + (Math.random() - 0.5) * 15,
              y: currentY + (Math.random() - 0.5) * 30,
              size: 8 + Math.random() * 12,
              opacity: 1,
            };

            return [
              ...faded.slice(-FAIRY_VISUAL_CONSTANTS.MAX_TRAIL_SPARKLES),
              newSparkle,
            ];
          }

          return faded;
        });
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [fairy.createdAt, fairy.x, fairy.y, flyTarget, bezierControl]);

  const morphProgress =
    phase === "morphing"
      ? Math.min(1, age / FAIRY_ANIMATION_TIMING.MORPH_DURATION)
      : 1;

  const isVisible = age < FAIRY_ANIMATION_TIMING.TOTAL_DURATION;
  const fairyOpacity =
    phase === "trail-fading"
      ? 0
      : phase === "flying"
        ? Math.max(
            0,
            1 -
              (age -
                FAIRY_ANIMATION_TIMING.MORPH_DURATION -
                FAIRY_ANIMATION_TIMING.FLY_DURATION * 0.7) /
                (FAIRY_ANIMATION_TIMING.FLY_DURATION * 0.3),
          )
        : 1;

  return {
    age,
    phase,
    fairyPos,
    orbitingSparkles,
    trailSparkles,
    colorPalette,
    morphProgress,
    fairyOpacity,
    wormOpacity: calculateWormOpacity(morphProgress),
    fairyFadeIn: calculateFairyFadeIn(morphProgress),
    morphScale: calculateMorphScale(morphProgress),
    glowIntensity: calculateGlowIntensity(age),
    isVisible,
  };
};
