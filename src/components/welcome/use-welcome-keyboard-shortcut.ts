import { useEffect } from "react";

interface UseWelcomeKeyboardShortcutOptions {
  handlePrimaryAction: () => void;
  isE2E: boolean;
  readyToContinue: boolean;
}

export const useWelcomeKeyboardShortcut = ({
  handlePrimaryAction,
  isE2E,
  readyToContinue,
}: UseWelcomeKeyboardShortcutOptions) => {
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (!["Escape", " ", "Enter"].includes(event.key)) return;
      if (!isE2E && !readyToContinue) return;
      event.preventDefault();
      handlePrimaryAction();
    };

    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("keydown", handleKey);
    };
  }, [handlePrimaryAction, isE2E, readyToContinue]);
};