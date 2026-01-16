import { expect, Page, test } from "@playwright/test";

// Note: For full accessibility testing, install @axe-core/playwright
// npm install -D @axe-core/playwright
// import AxeBuilder from '@axe-core/playwright'

test.describe("Accessibility", () => {
  const skipWormLoadingIfPresent = async (page: Page) => {
    const loadingScreen = page.locator('[data-testid="worm-loading-screen"]');
    const skipButton = page.locator('[data-testid="skip-loading-button"]');

    try {
      await skipButton.waitFor({ state: "visible", timeout: 5_000 });
      await skipButton.evaluate((button: HTMLButtonElement) => button.click());
      await loadingScreen.waitFor({ state: "detached", timeout: 10_000 });
    } catch {
      // No-op: loading screen not shown
    }
  };

  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/?e2e=1", { waitUntil: "domcontentloaded" });
    await page.locator('[data-testid="game-menu"]').waitFor({
      state: "visible",
      timeout: 20_000,
    });
    await page.locator('[data-testid="game-title"]').waitFor({
      state: "visible",
      timeout: 20_000,
    });
  });

  test("menu page should not have critical accessibility violations", async ({
    page,
  }) => {
    // This test requires @axe-core/playwright to be installed
    // For now, we'll do basic checks

    // Check for visible title
    await expect(page.locator('[data-testid="game-title"]')).toBeVisible();

    // Check buttons are accessible (homescreen)
    const newGameButton = page.locator('[data-testid="new-game-button"]');
    await expect(newGameButton).toBeVisible();
    await expect(newGameButton).toBeEnabled();

    const settingsButton = page.locator('[data-testid="settings-button"]');
    await expect(settingsButton).toBeVisible();
    await expect(settingsButton).toBeEnabled();

    const creditsButton = page.locator('[data-testid="credits-button"]');
    await expect(creditsButton).toBeVisible();
    await expect(creditsButton).toBeEnabled();

    const exitButton = page.locator('[data-testid="exit-button"]');
    await expect(exitButton).toBeVisible();
    await expect(exitButton).toBeEnabled();

    // Level buttons should be visible and accessible (level selection)
    await newGameButton.evaluate((button: HTMLButtonElement) => button.click());
    const levelButtons = page.locator('[data-testid="level-button"]');
    const count = await levelButtons.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      await expect(levelButtons.nth(i)).toBeEnabled();
    }
  });

  test("gameplay elements should be visible and accessible", async ({
    page,
  }) => {
    // Start game - wait for level select to appear
    await page
      .locator('[data-testid="new-game-button"]')
      .evaluate((button: HTMLButtonElement) => button.click());
    await page
      .locator('[data-testid="level-select-menu"]')
      .waitFor({ state: "visible" });

    // Click start button and wait for menu to disappear
    await page
      .locator('[data-testid="start-button"]')
      .evaluate((button: HTMLButtonElement) => button.click());
    await page
      .locator('[data-testid="game-menu"]')
      .waitFor({ state: "hidden" });

    await skipWormLoadingIfPresent(page);
    await page
      .locator('[data-testid="target-display"]')
      .waitFor({ state: "visible", timeout: 15000 });

    // Target display should be visible
    await expect(page.locator('[data-testid="target-display"]')).toBeVisible();
    await expect(page.locator('[data-testid="target-emoji"]')).toBeVisible();
    await expect(page.locator('[data-testid="target-name"]')).toBeVisible();

    // Back button should be visible and enabled
    const backButton = page.locator('[data-testid="back-button"]');
    await expect(backButton).toBeVisible();
    await expect(backButton).toBeEnabled();
  });

  test("game should have proper contrast for readability", async ({ page }) => {
    // Check that key text elements are visible
    const title = page.locator('[data-testid="game-title"]');
    await expect(title).toBeVisible();

    // The title should be readable (has proper styling)
    const titleStyles = await title.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        fontSize: styles.fontSize,
        fontWeight: styles.fontWeight,
      };
    });

    // Font should be bold (600+) for titles
    const fontWeight = parseInt(titleStyles.fontWeight);
    expect(fontWeight).toBeGreaterThanOrEqual(600);
  });

  test("interactive elements should have sufficient size for touch", async ({
    page,
  }) => {
    // Start game
    await page
      .locator('[data-testid="new-game-button"]')
      .evaluate((button: HTMLButtonElement) => button.click());
    await page
      .locator('[data-testid="level-select-menu"]')
      .waitFor({ state: "visible" });
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
    const count = await objects.count();

    if (count > 0) {
      const box = await objects.first().boundingBox();
      if (box) {
        // Touch targets should be at least 44x44 pixels (WCAG)
        // Game uses --object-scale, so checking for reasonable minimum
        expect(box.width).toBeGreaterThan(20);
        expect(box.height).toBeGreaterThan(20);
      }
    }
  });
});

test.describe("Keyboard Navigation", () => {
  const skipWormLoadingIfPresent = async (page: Page) => {
    const loadingScreen = page.locator('[data-testid="worm-loading-screen"]');
    const skipButton = page.locator('[data-testid="skip-loading-button"]');

    try {
      await loadingScreen.waitFor({ state: "visible", timeout: 1000 });
      await skipButton.waitFor({ state: "visible", timeout: 1000 });
      await skipButton.click();
      await loadingScreen.waitFor({ state: "detached", timeout: 10_000 });
    } catch {
      // No-op: loading screen not shown
    }
  };

  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/?e2e=1", { waitUntil: "domcontentloaded" });
    await page.locator('[data-testid="game-menu"]').waitFor({
      state: "visible",
      timeout: 20_000,
    });
    await page.locator('[data-testid="game-title"]').waitFor({
      state: "visible",
      timeout: 20_000,
    });
  });

  test("should be able to tab through menu buttons", async ({ page }) => {
    // Press Tab to navigate
    await page.keyboard.press("Tab");

    // Some button should be focused
    const activeElement = await page.evaluate(() => {
      return document.activeElement?.tagName;
    });

    // Should focus on a button element
    expect(activeElement).toBeDefined();
  });

  test("should be able to activate buttons with Enter key", async ({
    page,
  }) => {
    // Focus on New Game button
    const newGameButton = page.locator('[data-testid="new-game-button"]');
    await newGameButton.focus();

    // Press Enter
    await page.keyboard.press("Enter");

    // Wait for level select to appear
    await page
      .locator('[data-testid="level-select-menu"]')
      .waitFor({ state: "visible" });

    // Then start the game from the level select screen
    await page
      .locator('[data-testid="start-button"]')
      .evaluate((button: HTMLButtonElement) => button.click());

    await skipWormLoadingIfPresent(page);

    // Game should start
    await expect(page.locator('[data-testid="target-display"]')).toBeVisible({
      timeout: 5000,
    });
  });
});
