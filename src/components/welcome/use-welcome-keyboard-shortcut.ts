import { useEffect } from "react";
import { isWelcomeInteractionLocked, type WelcomePhase } from "./welcome-phase";

interface UseWelcomeKeyboardShortcutOptions {
  handlePrimaryAction: () => void;
  isE2E: boolean;
  phase: WelcomePhase;
}

export const useWelcomeKeyboardShortcut = ({
  handlePrimaryAction,
  isE2E,
  phase,
}: UseWelcomeKeyboardShortcutOptions) => {
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (![" ", "Enter"].includes(event.key)) return;
      if (!isE2E && isWelcomeInteractionLocked(phase)) return;
      event.preventDefault();
      handlePrimaryAction();
    };

    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("keydown", handleKey);
    };
  }, [handlePrimaryAction, isE2E, phase]);
};