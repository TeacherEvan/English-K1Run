import { useEffect } from "react";

const hasActiveUserGesture = () => {
  if (typeof navigator === "undefined") return true;

  const activation = (
    navigator as Navigator & {
      userActivation?: { isActive?: boolean };
    }
  ).userActivation;

  return activation?.isActive ?? true;
};

const requestFullscreen = () => {
  if (typeof document === "undefined" || !hasActiveUserGesture()) return;

  const elem = document.documentElement as HTMLElement & {
    mozRequestFullScreen?: () => Promise<void>;
    webkitRequestFullscreen?: () => Promise<void>;
    msRequestFullscreen?: () => Promise<void>;
  };

  if (!document.fullscreenElement) {
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch((err) => {
        if (import.meta.env.DEV) {
          console.log(
            "[Fullscreen] Error attempting to enable fullscreen:",
            err,
          );
        }
      });
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen();
    } else if (elem.mozRequestFullScreen) {
      elem.mozRequestFullScreen();
    } else if (elem.msRequestFullscreen) {
      elem.msRequestFullscreen();
    }
  }
};

/**
 * Keeps touch interactions controlled during gameplay.
 * Fullscreen itself is requested from explicit user actions.
 */
export const useFullscreenGuard = (gameStarted: boolean, isE2E: boolean) => {
  useEffect(() => {
    if (isE2E) return;

    const preventDefaultTouch = (e: TouchEvent) => {
      if (gameStarted && e.cancelable) {
        e.preventDefault();
      }
    };

    const preventMultiTouch = (e: TouchEvent) => {
      if (e.touches.length > 1 && gameStarted) {
        e.preventDefault();
      }
    };

    document.addEventListener("touchmove", preventDefaultTouch, {
      passive: false,
    });
    document.addEventListener("touchstart", preventMultiTouch, {
      passive: false,
    });

    return () => {
      document.removeEventListener("touchmove", preventDefaultTouch);
      document.removeEventListener("touchstart", preventMultiTouch);
    };
  }, [gameStarted, isE2E]);
};

/**
 * Requests fullscreen for explicit user actions (start game).
 */
export const triggerFullscreen = () => {
  if (typeof window === "undefined") return;
  requestFullscreen();
};
