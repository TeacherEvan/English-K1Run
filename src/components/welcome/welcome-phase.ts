export type WelcomePhase =
  | "readyToStart"
  | "playingNarration"
  | "readyToContinue"
  | "transitioningToMenu";

interface WelcomePhaseInput {
  fadeOut: boolean;
  readyToContinue: boolean;
  isSequencePlaying: boolean;
}

export const getWelcomePhase = ({
  fadeOut,
  readyToContinue,
  isSequencePlaying,
}: WelcomePhaseInput): WelcomePhase => {
  if (fadeOut) {
    return "transitioningToMenu";
  }

  if (isSequencePlaying) {
    return "playingNarration";
  }

  if (readyToContinue) {
    return "readyToContinue";
  }

  return "readyToStart";
};

export const isWelcomeInteractionLocked = (phase: WelcomePhase) =>
  phase === "playingNarration" || phase === "transitioningToMenu";
