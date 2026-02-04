import { useRef } from "react";
import { useViewportObserver } from "./game-logic/game-effects";
import { useDisplayAdjustment } from "./use-display-adjustment";

/**
 * Manages viewport sizing for gameplay updates.
 */
export const useGameLogicViewport = () => {
  const viewportRef = useRef({ width: 1920, height: 1080 });
  const { triggerResizeUpdate } = useDisplayAdjustment();
  useViewportObserver(viewportRef, triggerResizeUpdate);
  return { viewportRef };
};
