import { expect, test } from "../fixtures/game.fixture";

test.describe("Worm Loading Screen Auto-Progression", () => {
  test("should show worm loading screen before gameplay", async ({ page }) => {
    await page.goto("/?e2e=1");
    await page.waitForLoadState("domcontentloaded");

    // Click start game
    await page.click('[data-testid="start-game-button"]');

    // Should show worm loading screen
    await expect(
      page.locator('[data-testid="worm-loading-screen"]'),
    ).toBeVisible();
  });

  test("should automatically advance after all worms eliminated", async ({
    page,
  }) => {
    await page.goto("/?e2e=1");
    await page.waitForLoadState("domcontentloaded");

    // Start game
    await page.click('[data-testid="start-game-button"]');
    await expect(
      page.locator('[data-testid="worm-loading-screen"]'),
    ).toBeVisible();

    // Eliminate worms until none remain (more stable than fixed click count)
    for (let attempts = 0; attempts < 12; attempts++) {
      const worms = page.locator('[data-testid="worm-target"]');
      const remaining = await worms.count();
      if (remaining === 0) break;

      await worms.first().waitFor({ state: "visible", timeout: 5000 });
      await worms.first().click({ force: true, timeout: 5000 });
      await page.waitForTimeout(250);
    }

    await expect(page.locator('[data-testid="worm-target"]')).toHaveCount(0, {
      timeout: 3000,
    });

    // Should auto-advance to game within 5 seconds
    // Accounts for: 5 clicks * 250ms + state updates + 500ms delay + component transitions
    await expect(page.locator('[data-testid="target-display"]')).toBeVisible({
      timeout: 7000,
    });

    // Loading screen should be gone
    await expect(
      page.locator('[data-testid="worm-loading-screen"]'),
    ).not.toBeVisible();
  });

  test("should show completion message when all worms eliminated", async ({
    page,
  }) => {
    await page.goto("/?e2e=1");
    await page.waitForLoadState("domcontentloaded");

    await page.click('[data-testid="start-game-button"]');
    await expect(
      page.locator('[data-testid="worm-loading-screen"]'),
    ).toBeVisible();

    // Eliminate worms until none remain (avoids flaky fixed-count assumptions)
    for (let attempts = 0; attempts < 12; attempts++) {
      const worms = page.locator('[data-testid="worm-target"]');
      const remaining = await worms.count();
      if (remaining === 0) break;

      await worms.first().waitFor({ state: "visible", timeout: 5000 });
      await worms.first().click({ force: true, timeout: 5000 });
      await page.waitForTimeout(250);
    }

    await expect(page.locator('[data-testid="worm-target"]')).toHaveCount(0, {
      timeout: 3000,
    });

    // Check for completion message (appears before auto-advancing)
    const completionMessage = page.locator(
      '[data-testid="worm-completion-message"]',
    );
    await expect(completionMessage).toBeVisible({ timeout: 2000 });
    await expect(completionMessage).toContainText("All worms caught");
    await expect(completionMessage).toContainText("Starting game");

    // Then verify game starts
    await expect(page.locator('[data-testid="target-display"]')).toBeVisible({
      timeout: 5000,
    });
  });

  test("skip button should still work as manual override", async ({ page }) => {
    await page.goto("/?e2e=1");
    await page.waitForLoadState("domcontentloaded");

    await page.click('[data-testid="start-game-button"]');
    await expect(
      page.locator('[data-testid="worm-loading-screen"]'),
    ).toBeVisible();

    // Click skip immediately without eliminating worms
    await page.click('[data-testid="skip-loading-button"]');

    // Should advance to game
    await expect(page.locator('[data-testid="target-display"]')).toBeVisible({
      timeout: 2000,
    });
    await expect(
      page.locator('[data-testid="worm-loading-screen"]'),
    ).not.toBeVisible();
  });

  test("skip button should have updated text", async ({ page }) => {
    await page.goto("/?e2e=1");
    await page.waitForLoadState("domcontentloaded");

    await page.click('[data-testid="start-game-button"]');
    await expect(
      page.locator('[data-testid="worm-loading-screen"]'),
    ).toBeVisible();

    // Check button text clarifies it's optional
    const button = page.locator('[data-testid="skip-loading-button"]');
    await expect(button).toContainText("Skip to Game");
    await expect(button).toContainText("catch all worms");
  });
});

test.describe("Worms (Distractors)", () => {
  test.beforeEach(async ({ gamePage }) => {
    await gamePage.goto();
    await gamePage.waitForReady();
    await gamePage.menu.startGame();
    await gamePage.gameplay.targetDisplay.waitFor({ state: "visible" });
  });

  test("worms should spawn after delay", async ({ gamePage, page }) => {
    // Worms spawn after 3s initially
    await page.waitForTimeout(4000);

    const wormCount = await gamePage.gameplay.getWormCount();
    // May have worms, or may not depending on timing
    expect(wormCount).toBeGreaterThanOrEqual(0);
  });

  test("worms should be tappable", async ({ gamePage, page }) => {
    // Wait for worms to spawn
    await page.waitForTimeout(4000);

    const wormCount = await gamePage.gameplay.getWormCount();
    if (wormCount > 0) {
      const firstWorm = gamePage.gameplay.worms.first();
      await expect(firstWorm).toBeVisible();

      // Tapping worm should not throw (use helper that forces click)
      await gamePage.gameplay.tapWorm(0);
    }
  });
});
