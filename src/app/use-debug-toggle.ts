import type { Dispatch, SetStateAction } from "react";
import { useEffect } from "react";

/**
 * Enables Ctrl/Cmd + D to toggle debug overlays.
 */
export const useDebugToggle = (
  setDebugVisible: Dispatch<SetStateAction<boolean>>,
) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "d") {
        e.preventDefault();
        setDebugVisible((prev) => {
          const newState = !prev;
          if (import.meta.env.DEV) {
            console.log(
              `[Debug] Debug overlays ${newState ? "enabled" : "disabled"}`,
            );
          }
          return newState;
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setDebugVisible]);
};
