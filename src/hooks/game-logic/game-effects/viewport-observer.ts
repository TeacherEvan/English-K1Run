import type { MutableRefObject } from "react";
import { useEffect } from "react";

/**
 * Observes viewport size and updates the shared ref.
 */
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
