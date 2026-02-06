import { useEffect, useMemo, useState } from "react";
import type { FairyTransformObject } from "../../hooks/use-game-logic";
import {
  FAIRY_ANIMATION_TIMING,
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
import type { FairyAnimationState, FairyPhase } from "./fairy-animation-types";
import { createOrbitingSparkles } from "./sparkle-utils";
import type { OrbitSparkle } from "./types";
import { useFairyTrailSparkles } from "./use-fairy-trail";

/**
 * Drives time-based animation state for fairy transformations.
 */
export const useFairyAnimation = (
  fairy: FairyTransformObject,
): FairyAnimationState => {
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
  const { now, trailSparkles } = useFairyTrailSparkles({
    fairy,
    flyTarget,
    bezierControl,
  });

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
