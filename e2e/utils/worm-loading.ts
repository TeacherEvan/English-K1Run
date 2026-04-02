import type { Page } from "@playwright/test";

import { scaleTimeout } from "../fixtures/game.fixture";

const WORM_LOADING_SCREEN = '[data-testid="worm-loading-screen"]';
const SKIP_LOADING_BUTTON = '[data-testid="skip-loading-button"]';
const TARGET_DISPLAY = '[data-testid="target-display"]';

export async function skipWormLoadingIfPresent(
  page: Page,
  startupTimeout: number = 15_000,
): Promise<void> {
  const loadingScreen = page.locator(WORM_LOADING_SCREEN);
  const skipButton = page.locator(SKIP_LOADING_BUTTON);
  const targetDisplay = page.locator(TARGET_DISPLAY);

  try {
    await Promise.race([
      loadingScreen.waitFor({
        state: "visible",
        timeout: scaleTimeout(page, startupTimeout),
      }),
      targetDisplay.waitFor({
        state: "visible",
        timeout: scaleTimeout(page, startupTimeout),
      }),
    ]);
  } catch {
    return;
  }

  if (await targetDisplay.isVisible().catch(() => false)) {
    return;
  }

  await skipButton.waitFor({
    state: "visible",
    timeout: scaleTimeout(page, 10_000),
  });
  await skipButton.click({ force: true, timeout: scaleTimeout(page, 30_000) });
  await page.waitForFunction(
    ({ loadingSelector, targetSelector }) => {
      const loading = document.querySelector(loadingSelector);
      const target = document.querySelector(targetSelector);
      const targetVisible = Boolean(
        target && getComputedStyle(target).display !== "none",
      );
      return !loading || targetVisible;
    },
    {
      loadingSelector: WORM_LOADING_SCREEN,
      targetSelector: TARGET_DISPLAY,
    },
    { timeout: scaleTimeout(page, 2_000) },
  );

  if (await loadingScreen.isVisible().catch(() => false)) {
    await skipButton.evaluate((button: HTMLButtonElement) => {
      button.click();
    });
  }

    await Promise.race([
    loadingScreen.waitFor({
      state: "detached",
      timeout: scaleTimeout(page, 20_000),
    }),
    targetDisplay.waitFor({
      state: "visible",
      timeout: scaleTimeout(page, 20_000),
    }),
  ]);
}
