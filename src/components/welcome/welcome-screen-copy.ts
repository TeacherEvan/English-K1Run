import type { WelcomePhase } from "./welcome-phase";

type TranslateFn = (key: string, options?: { defaultValue?: string }) => string;

interface WelcomeStatusPanelVisibilityOptions {
  diagnosticLabel: string | null;
  isLanguageShellVisible: boolean;
  phase: WelcomePhase;
  showFallbackImage: boolean;
  showIntroStartPrompt: boolean;
}

export const getWelcomeActionLabel = (t: TranslateFn, phase: WelcomePhase) => {
  if (phase === "playingNarration") {
    return t("welcome.listening", { defaultValue: "Listening..." });
  }
  if (phase === "readyToContinue") {
    return t("menu.tapToContinue");
  }
  if (phase === "transitioningToMenu") {
    return t("welcome.transitioning", { defaultValue: "Opening menu..." });
  }
  return t("menu.tapToStart");
};

export const getWelcomeStatusLabel = (t: TranslateFn, phase: WelcomePhase) => {
  if (phase === "playingNarration") {
    return t("welcome.listeningHint", {
      defaultValue: "Please wait for the welcome audio",
    });
  }
  if (phase === "readyToContinue") {
    return t("welcome.readyContinue", { defaultValue: "Ready to continue" });
  }
  if (phase === "transitioningToMenu") {
    return t("welcome.transitioning", { defaultValue: "Opening menu..." });
  }
  return t("welcome.readyPrompt", { defaultValue: "Tap once to begin" });
};

export const shouldShowWelcomeStatusPanel = ({
  diagnosticLabel,
  isLanguageShellVisible,
  phase,
  showFallbackImage,
  showIntroStartPrompt,
}: WelcomeStatusPanelVisibilityOptions) =>
  !showFallbackImage &&
  (isLanguageShellVisible ||
    showIntroStartPrompt ||
    phase === "playingNarration" ||
    phase === "readyToContinue" ||
    phase === "transitioningToMenu" ||
    Boolean(diagnosticLabel));
