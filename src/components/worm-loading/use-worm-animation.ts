/**
 * Custom hook for worm animation loop management
 */

import { useEffect, useRef } from "react";
import { UPDATE_INTERVAL } from "./constants";
import type { Worm } from "./types";
import { calculateWormUpdate } from "./worm-utils";

interface UseWormAnimationProps {
  setWorms: React.Dispatch<React.SetStateAction<Worm[]>>;
  speedMultiplier: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Manages the animation frame loop for worm movement
 * Throttled to ~30fps for performance optimization
 */
export const useWormAnimation = ({
  setWorms,
  speedMultiplier,
  containerRef,
}: UseWormAnimationProps) => {
  const animationFrameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    // Cancel any existing animation frame before starting new one
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    let lastUpdateTime = 0;

    const animate = (currentNow: number) => {
      // Throttle updates for better performance
      if (currentNow - lastUpdateTime < UPDATE_INTERVAL) {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }
      lastUpdateTime = currentNow;

      setWorms((prev) =>
        prev.map((worm) => {
          const container = containerRef.current;
          if (!container) return worm;

          const containerWidth = container.clientWidth;
          const containerHeight = container.clientHeight;

          return calculateWormUpdate(
            worm,
            speedMultiplier,
            containerWidth,
            containerHeight,
          );
        }),
      );

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [speedMultiplier, setWorms, containerRef]);
};
