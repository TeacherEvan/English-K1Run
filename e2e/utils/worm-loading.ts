import type { Page } from "@playwright/test";

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
      loadingScreen.waitFor({ state: "visible", timeout: startupTimeout }),
      targetDisplay.waitFor({ state: "visible", timeout: startupTimeout }),
    ]);
  } catch {
    return;
  }

  if (await targetDisplay.isVisible().catch(() => false)) {
    return;
  }

  await skipButton.waitFor({ state: "visible", timeout: 10_000 });
  await skipButton.click({ force: true, timeout: 30_000 });
  await page.waitForTimeout(250);

  if (await loadingScreen.isVisible().catch(() => false)) {
    await skipButton.evaluate((button: HTMLButtonElement) => {
      button.click();
    });
  }

  await Promise.race([
    loadingScreen.waitFor({ state: "detached", timeout: 20_000 }),
    targetDisplay.waitFor({ state: "visible", timeout: 20_000 }),
  ]);
}
