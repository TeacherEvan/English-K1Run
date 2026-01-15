import { expect, test } from "@playwright/test";

test.describe("Visual Screenshots", () => {
  test("Capture welcome screen with animations", async ({ page }, testInfo) => {
    // Test welcome screen animations (without e2e flag to see animations)
    console.log("Testing welcome screen animations...");
    
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector('[data-testid="welcome-screen"]', { timeout: 10000 });
    
    // Wait for initial render
    await page.waitForTimeout(1000);
    
    // Capture initial state
    const welcomeInitial = await page.screenshot({
      path: testInfo.outputPath("welcome-screen-initial.png"),
    });
    await testInfo.attach("Welcome Screen - Initial", {
      body: welcomeInitial,
      contentType: "image/png",
    });
    
    // Wait for rainbow animation to complete (4s delay + 4s animation)
    await page.waitForTimeout(8500);
    
    const welcomeAnimated = await page.screenshot({
      path: testInfo.outputPath("welcome-screen-animated.png"),
    });
    await testInfo.attach("Welcome Screen - With Animations", {
      body: welcomeAnimated,
      contentType: "image/png",
    });
    
    // Test reduced motion
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForSelector('[data-testid="welcome-screen"]', { timeout: 10000 });
    await page.waitForTimeout(1000);
    
    const welcomeReducedMotion = await page.screenshot({
      path: testInfo.outputPath("welcome-screen-reduced-motion.png"),
    });
    await testInfo.attach("Welcome Screen - Reduced Motion", {
      body: welcomeReducedMotion,
      contentType: "image/png",
    });
    
    console.log("Welcome screen animation tests completed.");
  });

  test("Capture screenshots of menu, windows, and levels", async ({
    page,
  }, testInfo) => {
    // Increase timeout for initial load/lazy loading
    test.setTimeout(120000);

    console.log("Navigating to app...");
    await page.goto("/?e2e=1", { waitUntil: "domcontentloaded" });

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
    // Wait for potential animations to settle
    await page.waitForTimeout(2000);
    await page.click('[data-testid="settings-button"]', { force: true });
    // Wait for dialog content
    await page.waitForSelector("text=Settings / การตั้งค่า");
    // Small delay for animation
    await page.waitForTimeout(500);

    const settingsScreenshot = await page.screenshot({
      path: testInfo.outputPath("settings-window.png"),
    });
    await testInfo.attach("Settings Window", {
      body: settingsScreenshot,
      contentType: "image/png",
    });

    // Close settings (click outside or press Esc, or click close if exists - using Esc provided by playwright keyboard)
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300); // Wait for close animation

    // 3. Level Select
    console.log("Going to Level Select...");
    await page.click('[data-testid="new-game-button"]', { force: true });
    await page.waitForSelector('[data-testid="level-select-menu"]');

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
        page.locator('[data-testid="level-select-menu"]')
      ).toBeVisible();

      const levelName = await levelButtons.nth(i).innerText();
      // Sanitize name for filename
      const safeName = `level-${i}-${levelName
        .split("\n")[0]
        .replace(/[^a-z0-9]/gi, "_")
        .toLowerCase()}`;

      // Select level
      await levelButtons.nth(i).click({ force: true });

      // Click Start Game
      await page.click('[data-testid="start-button"]', { force: true });

      // Handle Worm Loading Screen (Skip it)
      try {
        // Wait briefly for the loading screen to appear
        await page.waitForSelector('[data-testid="skip-loading-button"]', {
          timeout: 5000,
        });
        // Click skip
        await page.click('[data-testid="skip-loading-button"]', {
          force: true,
        });
      } catch (_) {
        console.log("Skip button not found or already skipped");
      }

      // Wait for game to start (Back button appears)
      await page.waitForSelector('[data-testid="back-button"]', {
        timeout: 30000,
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
      await page.click('[data-testid="back-button"]', { force: true });

      // We are now at Main Menu
      await page.waitForSelector('[data-testid="game-menu"]');

      // Go back to Level Select for next iteration
      await page.click('[data-testid="new-game-button"]', { force: true });
      await page.waitForSelector('[data-testid="level-select-menu"]');
    }

    console.log("All screenshots captured.");
  });
});