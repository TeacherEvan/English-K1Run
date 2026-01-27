import type React from "react";

import { isKeyPressed, KeyboardKeys } from "./keyboard-utils";

/**
 * Common focusable elements selector (WCAG 2.2 compliant)
 * Cached to avoid repeated string concatenation
 */
const FOCUSABLE_ELEMENTS_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
  "details",
  "summary",
].join(", ");

/**
 * Focus trap manager for modals and dialogs
 * Prevents focus from leaving a container element
 */
export const createFocusTrap = (
  containerElement: HTMLElement,
): (() => void) => {
  if (!containerElement) {
    console.warn("[createFocusTrap] Container element is null or undefined");
    return () => {};
  }

  const getFocusableElements = (): HTMLElement[] => {
    try {
      return Array.from(
        containerElement.querySelectorAll<HTMLElement>(
          FOCUSABLE_ELEMENTS_SELECTOR,
        ),
      );
    } catch (error) {
      console.warn(
        "[createFocusTrap] Error querying focusable elements:",
        error,
      );
      return [];
    }
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!isKeyPressed(event, KeyboardKeys.TAB)) return;

    const focusableElements = getFocusableElements();
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Shift+Tab on first element: focus last
    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    }
    // Tab on last element: focus first
    else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  };

  // Focus first element on trap creation
  const focusableElements = getFocusableElements();
  if (focusableElements.length > 0) {
    try {
      focusableElements[0].focus();
    } catch (error) {
      console.warn("[createFocusTrap] Error focusing first element:", error);
    }
  }

  containerElement.addEventListener("keydown", handleKeyDown);

  // Return cleanup function
  return () => {
    containerElement.removeEventListener("keydown", handleKeyDown);
  };
};

/**
 * Get all focusable elements within a container
 * Useful for custom keyboard navigation
 */
export const getAllFocusableElements = (
  container: HTMLElement,
): HTMLElement[] => {
  if (!container) return [];

  try {
    return Array.from(
      container.querySelectorAll<HTMLElement>(FOCUSABLE_ELEMENTS_SELECTOR),
    );
  } catch (error) {
    console.warn("[getAllFocusableElements] Error querying elements:", error);
    return [];
  }
};

/**
 * Check if an element meets the minimum target size requirement (WCAG 2.2)
 * Ensures touch targets are at least 24x24 CSS pixels
 */
export const checkTargetSize = (
  element: HTMLElement,
  minSize = 24,
): boolean => {
  if (!element) return false;

  try {
    const rect = element.getBoundingClientRect();
    return rect.width >= minSize && rect.height >= minSize;
  } catch (error) {
    console.warn("[checkTargetSize] Error checking element size:", error);
    return false;
  }
};

/**
 * Check if the focused element is obscured (WCAG 2.2 Success Criterion 2.4.11)
 * Ensures focus indicators are not hidden by other elements
 */
export const isFocusObscured = (element: HTMLElement): boolean => {
  if (!element) return false;

  try {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Check if center point is visible
    const elementAtPoint = document.elementFromPoint(centerX, centerY);
    return elementAtPoint === element || element.contains(elementAtPoint);
  } catch (error) {
    console.warn("[isFocusObscured] Error checking focus visibility:", error);
    return false;
  }
};

/**
 * Move focus to the next/previous focusable element
 * Implements circular navigation
 */
export const moveFocusToAdjacentElement = (
  direction: "forward" | "backward",
  container?: HTMLElement,
): void => {
  const focusContainer = container || document.body;
  const focusableElements = getAllFocusableElements(focusContainer);

  if (focusableElements.length === 0) return;

  const currentIndex = focusableElements.findIndex(
    (el) => el === document.activeElement,
  );

  if (currentIndex === -1) {
    // No element focused, focus first
    focusableElements[0].focus();
    return;
  }

  let nextIndex: number;
  if (direction === "forward") {
    nextIndex = (currentIndex + 1) % focusableElements.length;
  } else {
    nextIndex =
      (currentIndex - 1 + focusableElements.length) % focusableElements.length;
  }

  focusableElements[nextIndex].focus();
};

/**
 * Enable/disable focus visible indicators based on input method
 * Shows focus rings only for keyboard navigation, not mouse clicks
 */
export const enableSmartFocusVisibility = (): void => {
  try {
    // Detect keyboard usage
    const handleKeyDown = () => {
      document.body.classList.add("using-keyboard");
    };

    // Detect mouse usage
    const handleMouseDown = () => {
      document.body.classList.remove("using-keyboard");
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleMouseDown);
  } catch (error) {
    console.warn(
      "[enableSmartFocusVisibility] Error enabling focus visibility:",
      error,
    );
  }
};

/**
 * Skip to main content link handler
 * Implements accessibility best practice for keyboard navigation
 */
export const createSkipToMainContentHandler = (
  mainContentId: string,
): ((event: React.MouseEvent | MouseEvent) => void) => {
  if (!mainContentId || typeof mainContentId !== "string") {
    console.warn(
      "[createSkipToMainContentHandler] Invalid mainContentId provided",
    );
    return () => {};
  }

  return (event: React.MouseEvent | MouseEvent) => {
    try {
      event.preventDefault();

      const mainContent = document.getElementById(mainContentId);
      if (mainContent) {
        mainContent.setAttribute("tabindex", "-1");
        mainContent.focus();
        mainContent.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        console.warn(
          `[createSkipToMainContentHandler] Element with ID '${mainContentId}' not found`,
        );
      }
    } catch (error) {
      console.warn(
        "[createSkipToMainContentHandler] Error handling skip link:",
        error,
      );
    }
  };
};
