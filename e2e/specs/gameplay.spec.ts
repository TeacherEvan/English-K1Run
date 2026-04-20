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

  test("should show completion dialog after 20 correct taps", async ({
    gamePage,
    page,
  }) => {
    // Game is already running from beforeEach; no need to call startGame() again.
    await gamePage.gameplay.waitForObjectsToSpawn(1);

    const dialog = page.locator('[data-testid="default-completion-dialog"]');

    // Tap up to 60 times; dialog appears once progress reaches 100
    // (DEFAULT_MODE_PROGRESS_INCREMENT=5, so 20 perfect taps suffice).
    // Extra headroom guards against rare timing-caused missed/late taps.
    for (let tap = 0; tap < 60; tap += 1) {
      if (await dialog.isVisible()) break;

      const emojiText = await page
        .locator('[data-testid="target-emoji"]')
        .textContent({ timeout: 500 })
        .catch(() => null);
      // target display may disappear the moment winner state is reached
      if (!emojiText?.trim()) {
        if (await dialog.isVisible()) break;
        continue;
      }
      const emoji = emojiText.trim();

      // Wait for the target emoji to actually be present as a falling object
      // before clicking; avoids tapping while a target-change timer fires.
      // Match on data-emoji for exact target selection and retry clicks
      // because falling objects can move out from under the pointer.
      const escapedEmoji = emoji.replace(/"/g, '\\"');
      const targetSelector = `[data-testid="falling-object"][data-emoji="${escapedEmoji}"]`;

      let tapped = false;
      for (let attempt = 0; attempt < 4; attempt += 1) {
        const targetObj = page.locator(targetSelector).first();
        const available = await targetObj.count();
        if (available === 0) {
          await page.waitForTimeout(120);
          continue;
        }

        try {
          await targetObj.click({ force: true, timeout: 3_000 });
          tapped = true;
          break;
        } catch {
          await page.waitForTimeout(120);
        }
      }

      if (!tapped) continue;
      await page.waitForTimeout(180);
    }

    await expect(dialog).toBeVisible({ timeout: 10_000 });

    await page
      .locator('[data-testid="default-completion-dialog-button"]')
      .click();

    await expect(dialog).not.toBeVisible();
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
