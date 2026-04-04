export type StartupBootPhase =
  | "branding"
  | "introReady"
  | "cacheWarm"
  | "complete";

export const getStartupBootPhase = (percentage: number): StartupBootPhase => {
  if (percentage >= 100) return "complete";
  if (percentage >= 75) return "cacheWarm";
  if (percentage >= 25) return "introReady";
  return "branding";
};
