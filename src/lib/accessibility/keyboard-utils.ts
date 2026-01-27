import type { KeyboardEvent as ReactKeyboardEvent } from "react";

/**
 * Keyboard key names for semantic event handling
 * Provides clear, readable alternatives to magic strings
 */
export const KeyboardKeys = {
  ENTER: "Enter",
  SPACE: " ",
  ESCAPE: "Escape",
  TAB: "Tab",
  ARROW_UP: "ArrowUp",
  ARROW_DOWN: "ArrowDown",
  ARROW_LEFT: "ArrowLeft",
  ARROW_RIGHT: "ArrowRight",
  HOME: "Home",
  END: "End",
  PAGE_UP: "PageUp",
  PAGE_DOWN: "PageDown",
} as const;

/**
 * Check if a keyboard event matches a specific key
 * Provides case-insensitive matching and handles legacy key codes
 */
export const isKeyPressed = (
  event: KeyboardEvent | ReactKeyboardEvent,
  targetKey: string,
): boolean => {
  return (
    event.key === targetKey ||
    event.key.toLowerCase() === targetKey.toLowerCase()
  );
};

/**
 * Check if multiple modifier keys are pressed
 * Useful for keyboard shortcuts and combinations
 */
export const areModifiersPressed = (
  event: KeyboardEvent | ReactKeyboardEvent,
  modifiers: {
    ctrl?: boolean;
    alt?: boolean;
    shift?: boolean;
    meta?: boolean;
  },
): boolean => {
  const checks: boolean[] = [];

  if (modifiers.ctrl !== undefined) {
    checks.push(event.ctrlKey === modifiers.ctrl);
  }
  if (modifiers.alt !== undefined) {
    checks.push(event.altKey === modifiers.alt);
  }
  if (modifiers.shift !== undefined) {
    checks.push(event.shiftKey === modifiers.shift);
  }
  if (modifiers.meta !== undefined) {
    checks.push(event.metaKey === modifiers.meta);
  }

  return checks.every((check) => check);
};
