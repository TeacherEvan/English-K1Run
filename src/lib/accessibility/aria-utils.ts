/**
 * ARIA live region politeness levels
 */
export type AriaLivePoliteness = "off" | "polite" | "assertive";

/**
 * Announce a message to screen readers using ARIA live region
 * Creates a temporary live region that auto-removes after announcement
 */
export const announceToScreenReader = (
  message: string,
  politeness: AriaLivePoliteness = "polite",
  timeoutMs = 1000,
): void => {
  if (!message || typeof message !== "string") {
    console.warn("[announceToScreenReader] Invalid message provided");
    return;
  }

  try {
    // Create temporary live region
    const liveRegion = document.createElement("div");
    liveRegion.setAttribute("role", "status");
    liveRegion.setAttribute("aria-live", politeness);
    liveRegion.setAttribute("aria-atomic", "true");
    liveRegion.className = "sr-only"; // Visually hidden but accessible
    liveRegion.textContent = message;

    // Add to DOM
    if (document.body) {
      document.body.appendChild(liveRegion);

      // Remove after timeout
      setTimeout(() => {
        if (liveRegion.parentNode) {
          liveRegion.parentNode.removeChild(liveRegion);
        }
      }, timeoutMs);
    } else {
      console.warn("[announceToScreenReader] document.body not available");
    }
  } catch (error) {
    console.warn("[announceToScreenReader] Error announcing message:", error);
  }
};

/**
 * Create ARIA attributes object for a component
 * Simplifies adding accessibility attributes
 */
export const createAriaAttributes = (config: {
  label?: string;
  labelledBy?: string;
  describedBy?: string;
  pressed?: boolean;
  expanded?: boolean;
  selected?: boolean;
  disabled?: boolean;
  controls?: string;
  owns?: string;
  role?: string;
  live?: AriaLivePoliteness;
  atomic?: boolean;
  relevant?: string;
}): Record<string, string | boolean | undefined> => {
  const attrs: Record<string, string | boolean | undefined> = {};

  if (config.label) attrs["aria-label"] = config.label;
  if (config.labelledBy) attrs["aria-labelledby"] = config.labelledBy;
  if (config.describedBy) attrs["aria-describedby"] = config.describedBy;
  if (config.pressed !== undefined)
    attrs["aria-pressed"] = config.pressed.toString();
  if (config.expanded !== undefined)
    attrs["aria-expanded"] = config.expanded.toString();
  if (config.selected !== undefined)
    attrs["aria-selected"] = config.selected.toString();
  if (config.disabled !== undefined)
    attrs["aria-disabled"] = config.disabled.toString();
  if (config.controls) attrs["aria-controls"] = config.controls;
  if (config.owns) attrs["aria-owns"] = config.owns;
  if (config.role) attrs["role"] = config.role;
  if (config.live) attrs["aria-live"] = config.live;
  if (config.atomic !== undefined)
    attrs["aria-atomic"] = config.atomic.toString();
  if (config.relevant) attrs["aria-relevant"] = config.relevant;

  return attrs;
};
