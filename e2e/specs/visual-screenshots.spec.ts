import { expect, test } from "@playwright/test";
import { navigateWithRetry } from "../utils/navigation";
import { skipWormLoadingIfPresent } from "../utils/worm-loading";

test.describe("Visual Screenshots", () => {
  test.slow();
  test("Capture screenshots of menu, windows, and levels", async ({
    page,
  }, testInfo) => {
    // Increase timeout for initial load/lazy loading
    test.setTimeout(300000);

    console.log("Navigating to app...");
    await navigateWithRetry(page, "/?e2e=1");

    // Inject CSS to disable background animations for stable testing
    await page.addStyleTag({
      content: `
        .app-bg-animated {
          animation: none !important;
        }
        * {
          animation-duration: 0.01ms !important;
          transition-duration: 0.01ms !important;
        }
      `,
    });

    // 1. Main Menu
    console.log("Waiting for Game Menu...");
    // Wait for connection/loading to finish
    await page.waitForSelector('[data-testid="game-menu"]', { timeout: 30000 });

    const menuScreenshot = await page.screenshot({
      path: testInfo.outputPath("menu-screen.png"),
    });
    await testInfo.attach("Menu Screen", {
      body: menuScreenshot,
      contentType: "image/png",
    });

    // 2. Settings Window
    console.log("Opening Settings...");
    // Wait for menu to be fully loaded
    await page.waitForTimeout(2000);
    // Click settings button (animations disabled via reducedMotion config)
    const settingsButton = page.locator('[data-testid="settings-button"]');
    await settingsButton.waitFor({ state: "visible", timeout: 5000 });
    await settingsButton.click({ force: true, timeout: 30000 });
    // Wait for the current dialog structure instead of an outdated title copy.
    const settingsDialog = page.getByRole("dialog", { name: /settings/i });
    await settingsDialog.waitFor({ state: "visible", timeout: 5000 });
    const settingsTitle = settingsDialog.getByRole("heading", {
      level: 2,
      name: /settings/i,
    });
    await settingsTitle.waitFor({ state: "visible", timeout: 5000 });
    // Small delay for animation
    await page.waitForTimeout(500);

    const settingsScreenshot = await page.screenshot({
      path: testInfo.outputPath("settings-window.png"),
    });
    await testInfo.attach("Settings Window", {
      body: settingsScreenshot,
      contentType: "image/png",
    });

    // Close settings without a pointer click so we do not click through to
    // the menu buttons underneath when the dialog unmounts.
    await page.keyboard.press("Escape");
    await settingsTitle.waitFor({ state: "detached", timeout: 10000 });

    // 3. Level Select
    console.log("Going to Level Select...");
    const levelSelectButton = page.locator(
      '[data-testid="level-select-button"]',
    );
    await levelSelectButton.waitFor({ state: "visible", timeout: 10000 });
    await levelSelectButton.click({ force: true, timeout: 30000 });
    await page.waitForSelector('[data-testid="level-select-menu"]', {
      timeout: 20000,
    });

    const levelSelectScreenshot = await page.screenshot({
      path: testInfo.outputPath("level-select-screen.png"),
    });
    await testInfo.attach("Level Select Screen", {
      body: levelSelectScreenshot,
      contentType: "image/png",
    });

    // 4. Iterate Levels
    // Get number of levels available by counting buttons
    const levelButtons = page.locator('[data-testid="level-button"]');
    const count = await levelButtons.count();
    console.log(`Found ${count} levels.`);

    for (let i = 0; i < count; i++) {
      console.log(`Processing Level ${i + 1}...`);

      // Ensure we are on level select screen
      await expect(
        page.locator('[data-testid="level-select-menu"]'),
      ).toBeVisible();

      const levelName = await levelButtons.nth(i).innerText();
      // Sanitize name for filename
      const safeName = `level-${i}-${levelName
        .split("\n")[0]
        .replace(/[^a-z0-9]/gi, "_")
        .toLowerCase()}`;

      // Select level
      await levelButtons.nth(i).click({ force: true, timeout: 30000 });

      // Click Start Game
      const startGameBtn = page.locator('[data-testid="start-button"]');
      await startGameBtn.waitFor({ state: "visible", timeout: 10000 });
      await startGameBtn.click({ force: true, timeout: 30000 });

      // Handle Worm Loading Screen with the shared helper used by gameplay specs.
      const targetDisplay = page.locator('[data-testid="target-display"]');

      // Small delay for Firefox DOM stabilization
      await page.waitForTimeout(500);

      await skipWormLoadingIfPresent(page, 20_000);

      // Ensure game HUD is visible (critical for Firefox stability)
      await targetDisplay.waitFor({ state: "visible", timeout: 45000 });

      // Wait for game to be fully ready (Back button appears)
      await page.waitForSelector('[data-testid="back-button"]', {
        timeout: 45000,
      });

      // Wait a bit for game elements to spawn/settle
      await page.waitForTimeout(1000);

      const levelScreenshot = await page.screenshot({
        path: testInfo.outputPath(`${safeName}.png`),
      });
      await testInfo.attach(`Level ${i + 1} Gameplay`, {
        body: levelScreenshot,
        contentType: "image/png",
      });

      // Go back
      const backBtn = page.locator('[data-testid="back-button"]');
      await backBtn.waitFor({ state: "visible", timeout: 5000 });
      await backBtn.click({ force: true, timeout: 30000 });

      // Reload page to ensure clean state for next level
      // This prevents state pollution across multiple game starts
      if (i < count - 1) {
        await navigateWithRetry(page, "/?e2e=1");
        await page.waitForSelector('[data-testid="game-menu"]', {
          timeout: 10000,
        });

        // Navigate to level select
        const levelSelectBtn = page.locator(
          '[data-testid="level-select-button"]',
        );
        await levelSelectBtn.waitFor({ state: "visible", timeout: 10000 });
        await levelSelectBtn.click({ timeout: 30000 });
        await page.waitForSelector('[data-testid="level-select-menu"]', {
          timeout: 15000,
        });
      }
    }

    console.log("All screenshots captured.");
  });
});
