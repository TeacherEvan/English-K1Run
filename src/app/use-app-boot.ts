import { useEffect } from "react";

/**
 * Signals app boot after first render.
 */
export const useAppBootSignal = () => {
  useEffect(() => {
    window.__APP_BOOTED__ = true;
    window.dispatchEvent(new Event("__app_ready__"));
  }, []);
};
