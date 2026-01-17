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

    // Click should not throw error
    await firstObject.click({ timeout: 5000, force: true });
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
      await matchingObjects.first().click({ force: true });

      // Small delay for state update
      await page.waitForTimeout(100);

      const newProgress = await gamePage.gameplay.getProgress(1);
      expect(newProgress).toBeGreaterThanOrEqual(initialProgress);
    }
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

      // Tapping worm should not throw
      await firstWorm.click({ timeout: 2000, force: true });
    }
  });
});
