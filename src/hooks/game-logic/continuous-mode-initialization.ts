import type { MutableRefObject } from "react";

export interface ContinuousModeSetupDependencies {
  continuousMode: boolean;
  continuousModeTargetCount: MutableRefObject<number>;
  setContinuousModeStartTime: (time: number | null) => void;
}

/**
 * Sets up continuous mode if enabled.
 */
export const setupContinuousMode = (
  dependencies: ContinuousModeSetupDependencies,
): void => {
  const { continuousMode, continuousModeTargetCount, setContinuousModeStartTime } =
    dependencies;

  continuousModeTargetCount.current = 0;

  if (continuousMode) {
    setContinuousModeStartTime(Date.now());
  }
};
