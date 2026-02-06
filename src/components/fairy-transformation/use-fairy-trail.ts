import { useEffect, useRef, useState } from "react";
import type { FairyTransformObject } from "../../hooks/use-game-logic";
import {
  FAIRY_ANIMATION_TIMING,
  FAIRY_VISUAL_CONSTANTS,
  easeOutCubic,
  quadraticBezier,
} from "../../lib/constants/fairy-animations";
import type { TrailSparkle } from "./types";

interface FairyTrailInputs {
  fairy: FairyTransformObject;
  flyTarget: { x: number; y: number };
  bezierControl: { x: number; y: number };
}

/**
 * Tracks requestAnimationFrame timing and generates trail sparkles.
 */
export const useFairyTrailSparkles = ({
  fairy,
  flyTarget,
  bezierControl,
}: FairyTrailInputs) => {
  const [now, setNow] = useState(() => Date.now());
  const [trailSparkles, setTrailSparkles] = useState<TrailSparkle[]>([]);
  const sparkleIdRef = useRef(0);
  const frameCountRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef(0);
  const epochOffsetRef = useRef<number | null>(null);

  useEffect(() => {
    let animationFrameId: number;

    const animate = (currentNow: number) => {
      if (epochOffsetRef.current === null) {
        epochOffsetRef.current = Date.now() - performance.now();
      }

      const epochNow = currentNow + epochOffsetRef.current;

      if (startTimeRef.current === null) {
        startTimeRef.current = currentNow - (epochNow - fairy.createdAt);
      }

      frameCountRef.current++;
      const timeSinceLastUpdate = currentNow - lastUpdateTimeRef.current;
      if (timeSinceLastUpdate >= FAIRY_ANIMATION_TIMING.UPDATE_INTERVAL) {
        lastUpdateTimeRef.current = currentNow;
        setNow(Math.round(epochNow));
      }

      const currentAge = currentNow - startTimeRef.current;
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

  return { now, trailSparkles };
};
