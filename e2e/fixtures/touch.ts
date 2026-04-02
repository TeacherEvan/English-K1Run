import type { Locator } from "@playwright/test";

/**
 * Touch event helper for tablet/mobile testing
 */
export async function simulateTap(locator: Locator) {
  const bounds = await locator.boundingBox();
  if (!bounds) throw new Error("Element not visible");

  const centerX = bounds.x + bounds.width / 2;
  const centerY = bounds.y + bounds.height / 2;
  const touches = [
    {
      identifier: 0,
      clientX: centerX,
      clientY: centerY,
      pageX: centerX,
      pageY: centerY,
    },
  ];

  await locator.dispatchEvent("touchstart", {
    touches,
    changedTouches: touches,
    targetTouches: touches,
  });
  await locator.dispatchEvent("touchend", {
    touches: [],
    changedTouches: touches,
    targetTouches: [],
  });
}
