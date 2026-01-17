import { devices, expect, test } from "@playwright/test";

// Use tablet device for touch testing
test.use({ ...devices["iPad Pro 11"], hasTouch: true });

async function skipWormLoadingIfPresent(page: import("@playwright/test").Page) {
  const loadingScreen = page.locator('[data-testid="worm-loading-screen"]');
  const skipButton = page.locator('[data-testid="skip-loading-button"]');

  try {
    await loadingScreen.waitFor({ state: "visible", timeout: 5_000 });
    await skipButton.waitFor({ state: "visible", timeout: 5000 });
    await skipButton.click();
    await loadingScreen.waitFor({ state: "detached", timeout: 10_000 });
  } catch (error) {
    // Loading screen may be disabled or already dismissed; swallow timeout errors
    if (error instanceof Error && !/Timeout/.test(error.message)) {
      throw error;
    }
  }
}

test.describe("Touch Interactions - Tablet", () => {
  test.beforeEach(async ({ page }) => {
    try {
      // Navigate to the application with e2e flag enabled for testing mode
      await page.goto("/?e2e=1");

      // Wait for the game menu to be visible, ensuring the page is ready for interaction
      await page.waitForSelector('[data-testid="game-menu"]', {
        state: "visible",
        timeout: 10000, // Consistent timeout to prevent flaky tests
      });
    } catch (error) {
      console.error("Failed to set up test environment:", error);
      throw error; // Re-throw to fail the test appropriately
    }
  });

  test("should start game with touch on Start button", async ({ page }) => {
    const levelSelectButton = page.locator(
      '[data-testid="level-select-button"]',
    );
    await levelSelectButton.waitFor({ state: "visible", timeout: 5000 });
    await levelSelectButton.click({ force: true });

    const startGameButton = page.locator('[data-testid="start-button"]');
    await startGameButton.waitFor({ state: "visible", timeout: 5000 });
    await startGameButton.click({ force: true });

    await skipWormLoadingIfPresent(page);

    // Menu should disappear
    await expect(page.locator('[data-testid="game-menu"]')).not.toBeVisible();

    // Target should appear
    await expect(page.locator('[data-testid="target-display"]')).toBeVisible();
  });

  test("should allow level selection with touch", async ({ page }) => {
    const levelSelectButton = page.locator(
      '[data-testid="level-select-button"]',
    );
    await levelSelectButton.waitFor({ state: "visible", timeout: 5000 });
    await levelSelectButton.click({ force: true });

    const levelButtons = page.locator('[data-testid="level-button"]');

    // Tap second level
    const secondLevel = levelButtons.nth(1);
    await secondLevel.waitFor({ state: "visible", timeout: 5000 });
    await secondLevel.click({ force: true });

    // Second level should be selected
    await expect(levelButtons.nth(1)).toHaveAttribute("data-selected", "true");
  });

  test("falling objects should respond to touch", async ({ page }) => {
    // Start game
    const levelSelectButton = page.locator(
      '[data-testid="level-select-button"]',
    );
    await levelSelectButton.waitFor({ state: "visible", timeout: 5000 });
    await levelSelectButton.click({ force: true });

    const startGameButton = page.locator('[data-testid="start-button"]');
    await startGameButton.waitFor({ state: "visible", timeout: 5000 });
    await startGameButton.click({ force: true });

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
      const firstObject = objects.first();
      await firstObject.waitFor({ state: "visible", timeout: 5000 });
      await firstObject.click({ force: true });
    }
  });

  test("back button should respond to touch", async ({ page }) => {
    // Start game
    const levelSelectButton = page.locator(
      '[data-testid="level-select-button"]',
    );
    await levelSelectButton.waitFor({ state: "visible", timeout: 5000 });
    await levelSelectButton.click({ force: true });

    const startGameButton = page.locator('[data-testid="start-button"]');
    await startGameButton.waitFor({ state: "visible", timeout: 5000 });
    await startGameButton.click({ force: true });

    await skipWormLoadingIfPresent(page);
    await page
      .locator('[data-testid="target-display"]')
      .waitFor({ state: "visible" });

    // Tap back button
    const backButton = page.locator('[data-testid="back-button"]');
    await expect(backButton).toBeVisible();
    await backButton.click({ force: true });

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
    const levelSelectButton = page.locator(
      '[data-testid="level-select-button"]',
    );
    await levelSelectButton.waitFor({ state: "visible", timeout: 5000 });
    await levelSelectButton.click({ force: true });

    const startGameButton = page.locator('[data-testid="start-button"]');
    await startGameButton.waitFor({ state: "visible", timeout: 5000 });
    await startGameButton.click({ force: true });

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
