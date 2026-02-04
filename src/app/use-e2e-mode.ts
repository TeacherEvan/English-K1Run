import { useEffect, useMemo } from "react";

/**
 * Detects E2E mode and applies the global class.
 */
export const useE2EMode = () => {
  const isE2E = useMemo(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).get("e2e") === "1";
  }, []);

  useEffect(() => {
    if (isE2E) {
      document.documentElement.classList.add("e2e-mode");
    }
  }, [isE2E]);

  return isE2E;
};
