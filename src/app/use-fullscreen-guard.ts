import { useEffect } from "react";

const requestFullscreen = () => {
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
 * Enables fullscreen aggressively on user interaction unless in E2E mode.
 */
export const useFullscreenGuard = (gameStarted: boolean, isE2E: boolean) => {
  useEffect(() => {
    if (isE2E) return;

    let fullscreenTriggered = false;

    const triggerFullscreen = () => {
      if (!fullscreenTriggered) {
        fullscreenTriggered = true;
        requestFullscreen();
      }
    };

    const handleInteraction = () => {
      triggerFullscreen();
    };

    const attemptImmediateFullscreen = () => {
      setTimeout(() => {
        if (!document.fullscreenElement) {
          requestFullscreen();
        }
      }, 100);
    };
    attemptImmediateFullscreen();

    const events = [
      "click",
      "touchstart",
      "touchend",
      "mousedown",
      "keydown",
      "keypress",
    ];
    events.forEach((event) => {
      document.addEventListener(event, handleInteraction, {
        once: true,
        passive: true,
      });
    });

    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "visible" &&
        !document.fullscreenElement
      ) {
        requestFullscreen();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

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
      events.forEach((event) => {
        document.removeEventListener(event, handleInteraction);
      });
      document.removeEventListener("visibilitychange", handleVisibilityChange);
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
