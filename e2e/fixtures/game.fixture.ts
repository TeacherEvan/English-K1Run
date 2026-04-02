import { expect, test as base } from "@playwright/test";

/**
 * Touch event helper for tablet/mobile testing
 */
export async function simulateTap(locator: Locator) {
  const bounds = await locator.boundingBox();

  const centerX = bounds.x + bounds.width / 2;
  const centerY = bounds.y + bounds.height / 2;

  // Dispatch touch events
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

// TODO: [OPTIMIZATION] Consider integrating with Playwright's test-level retries for broader flaky test handling.
=======
export { clickMovingElement, scaleTimeout, waitForBrowserDelay } from "./browser-helpers";
export { GamePage } from "./game-page";
export { GameMenuPage } from "./game-menu-page";
export { GameplayPage } from "./gameplay-page";
export { AudioMock } from "./audio-mock";
export { simulateTap } from "./touch";
>>>>>>> 0f7707f (feat: update sound assets and improve accessibility preferences)
