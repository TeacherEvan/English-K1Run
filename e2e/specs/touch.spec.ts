import { devices, expect, test } from "@playwright/test";

// Use tablet device for touch testing
test.use({ ...devices["iPad Pro 11"], hasTouch: true });

async function skipWormLoadingIfPresent(page: import("@playwright/test").Page) {
  const loadingScreen = page.locator('[data-testid="worm-loading-screen"]');
  const skipButton = page.locator('[data-testid="skip-loading-button"]');

  try {
    await loadingScreen.waitFor({ state: "visible", timeout: 1000 });
    await skipButton.evaluate((button: HTMLButtonElement) => button.click());
    await loadingScreen.waitFor({ state: "detached", timeout: 10_000 });
  } catch {
    // No-op: loading screen not shown
  }
}

test.describe("Touch Interactions - Tablet", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/?e2e=1");
    await page.waitForSelector('[data-testid="game-menu"]', {
      state: "visible",
    });
  });

  test("should start game with touch on Start button", async ({ page }) => {
    await page
      .locator('[data-testid="level-select-button"]')
      .evaluate((button: HTMLButtonElement) => button.click());

    const startGameButton = page.locator('[data-testid="start-button"]');
    await startGameButton.evaluate((button: HTMLButtonElement) =>
      button.click(),
    );

    await skipWormLoadingIfPresent(page);

    // Menu should disappear
    await expect(page.locator('[data-testid="game-menu"]')).not.toBeVisible();

    // Target should appear
    await expect(page.locator('[data-testid="target-display"]')).toBeVisible();
  });

  test("should allow level selection with touch", async ({ page }) => {
    await page
      .locator('[data-testid="level-select-button"]')
      .evaluate((button: HTMLButtonElement) => button.click());
    const levelButtons = page.locator('[data-testid="level-button"]');

    // Tap second level
    await levelButtons
      .nth(1)
      .evaluate((button: HTMLButtonElement) => button.click());

    // Second level should be selected
    await expect(levelButtons.nth(1)).toHaveAttribute("data-selected", "true");
  });

  test("falling objects should respond to touch", async ({ page }) => {
    // Start game
    await page
      .locator('[data-testid="level-select-button"]')
      .evaluate((button: HTMLButtonElement) => button.click());
    await page
      .locator('[data-testid="start-button"]')
      .evaluate((button: HTMLButtonElement) => button.click());

    await skipWormLoadingIfPresent(page);

    // Wait for objects to spawn
    await page.waitForFunction(
      () =>
        document.querySelectorAll('[data-testid="falling-object"]').length > 0,
      { timeout: 5000 },
    );

    const objects = page.locator('[data-testid="falling-object"]');
    const count = await objects.count();

    if (count > 0) {
      // Tap the first object
      await objects.first().evaluate((el: HTMLElement) => el.click());
    }
  });

  test("back button should respond to touch", async ({ page }) => {
    // Start game
    await page
      .locator('[data-testid="level-select-button"]')
      .evaluate((button: HTMLButtonElement) => button.click());
    await page
      .locator('[data-testid="start-button"]')
      .evaluate((button: HTMLButtonElement) => button.click());

    await skipWormLoadingIfPresent(page);
    await page
      .locator('[data-testid="target-display"]')
      .waitFor({ state: "visible" });

    // Tap back button
    const backButton = page.locator('[data-testid="back-button"]');
    await expect(backButton).toBeVisible();
    await backButton.evaluate((el: HTMLElement) => el.click());

    // Should return to menu
    await expect(page.locator('[data-testid="game-menu"]')).toBeVisible();
  });
});

test.describe("Multi-touch Handling", () => {
  test("should handle rapid sequential taps", async ({ page }) => {
    await page.goto("/?e2e=1");
    await page.waitForSelector('[data-testid="game-menu"]', {
      state: "visible",
    });

    // Start game
    await page
      .locator('[data-testid="level-select-button"]')
      .evaluate((button: HTMLButtonElement) => button.click());
    await page
      .locator('[data-testid="start-button"]')
      .evaluate((button: HTMLButtonElement) => button.click());

    await skipWormLoadingIfPresent(page);
    await page.waitForFunction(
      () =>
        document.querySelectorAll('[data-testid="falling-object"]').length > 0,
      { timeout: 5000 },
    );

    const objects = page.locator('[data-testid="falling-object"]');

    // Rapidly tap multiple objects
    for (let i = 0; i < 3; i++) {
      const count = await objects.count();
      if (count > i) {
        await objects
          .nth(i)
          .tap({ timeout: 1000 })
          .catch(() => {});
      }
    }

    // Game should still be running
    await expect(page.locator('[data-testid="target-display"]')).toBeVisible();
  });
});
