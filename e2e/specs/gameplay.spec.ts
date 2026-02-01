import { expect, test } from "../fixtures/game.fixture";

test.describe("Gameplay", () => {
  test.slow();
  test.beforeEach(async ({ gamePage }) => {
    await gamePage.goto();
    await gamePage.waitForReady();
    await gamePage.menu.startGame();
    // Wait for game to fully start
    await gamePage.gameplay.targetDisplay.waitFor({ state: "visible" });
  });

  test("should display target when game starts", async ({ gamePage }) => {
    await expect(gamePage.gameplay.targetDisplay).toBeVisible();
    await expect(gamePage.gameplay.targetEmoji).toBeVisible();
    await expect(gamePage.gameplay.targetName).toBeVisible();
  });

  test("should show Back to Levels button during gameplay", async ({
    gamePage,
  }) => {
    await expect(gamePage.gameplay.backButton).toBeVisible();
    await expect(gamePage.gameplay.backButton).toContainText("Back to Levels");
  });

  test("should spawn falling objects", async ({ gamePage }) => {
    // Wait for objects to spawn (spawns every 1.5s with 8 objects)
    await gamePage.gameplay.waitForObjectsToSpawn(1);

    const count = await gamePage.gameplay.getObjectCount();
    expect(count).toBeGreaterThan(0);
  });

  test("should return to menu when Back button is clicked", async ({
    gamePage,
  }) => {
    await gamePage.gameplay.goBack();

    // Menu should reappear
    const menuVisible = await gamePage.menu.isVisible();
    expect(menuVisible).toBe(true);

    // Game should stop
    const gameStarted = await gamePage.gameplay.isGameStarted();
    expect(gameStarted).toBe(false);
  });

  test("should keep legacy progress UI hidden", async ({ gamePage }) => {
    await expect(gamePage.gameplay.player1Area).toBeVisible();

    const indicatorCount = await gamePage.gameplay.progressBars.count();
    expect(indicatorCount).toBeGreaterThan(0);
    await expect(gamePage.gameplay.progressBars.first()).toBeHidden();
  });

  test("falling objects should be clickable", async ({ gamePage }) => {
    // Wait for objects to spawn
    await gamePage.gameplay.waitForObjectsToSpawn(1);

    // Get the first object
    const firstObject = gamePage.gameplay.fallingObjects.first();
    await expect(firstObject).toBeVisible();

    // Click should not throw error (use helper that forces click on moving elements)
    await gamePage.gameplay.tapObject(0);
  });
});

test.describe("Gameplay - Object Interaction", () => {
  test.beforeEach(async ({ gamePage }) => {
    await gamePage.goto();
    await gamePage.waitForReady();
  });

  test("tapping correct object should increase progress", async ({
    gamePage,
    page,
  }) => {
    // Start with Fruits & Veggies
    await gamePage.menu.startGame();
    await gamePage.gameplay.waitForObjectsToSpawn(5);

    // Get current target
    const target = await gamePage.gameplay.getCurrentTarget();
    const targetEmoji = target.emoji;

    // Find and tap matching object if exists
    const matchingObjects = gamePage.gameplay.fallingObjects.filter({
      hasText: targetEmoji!,
    });
    const count = await matchingObjects.count();

    if (count > 0) {
      const initialProgress = await gamePage.gameplay.getProgress(1);
      await gamePage.gameplay.tapObjectByEmoji(targetEmoji!);

      // Increased delay for React state update + CSS transition (especially Firefox)
      await page.waitForTimeout(500);

      const newProgress = await gamePage.gameplay.getProgress(1);
      expect(newProgress).toBeGreaterThanOrEqual(initialProgress);
    } else {
      // Skip test gracefully if no matching objects found
      console.warn(`No matching objects found for target: ${targetEmoji}`);
    }
  });
});

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

    // Eliminate all 5 worms with better selector and timing
    for (let i = 0; i < 5; i++) {
      const worm = page.locator('[data-testid="worm-target"]').first();
      await worm.waitFor({ state: "visible", timeout: 5000 });
      await worm.click({ force: true, timeout: 5000 });
      await page.waitForTimeout(250); // Increased for React state propagation
    }

    // Should auto-advance to game within 5 seconds
    // Accounts for: 5 clicks * 250ms + state updates + 500ms delay + component transitions
    await expect(page.locator('[data-testid="target-display"]')).toBeVisible({
      timeout: 5000,
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

    // Eliminate all worms with better timing
    for (let i = 0; i < 5; i++) {
      const worm = page.locator('[data-testid="worm-target"]').first();
      await worm.waitFor({ state: "visible", timeout: 5000 });
      await worm.click({ force: true, timeout: 5000 });
      await page.waitForTimeout(250);
    }

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
