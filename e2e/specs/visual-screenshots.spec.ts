import { expect, test } from "@playwright/test";

test.describe("Visual Screenshots", () => {
  test.slow();
  test("Capture welcome screen with animations", async ({ page }, testInfo) => {
    // Test welcome screen animations (without e2e flag to see animations)
    console.log("Testing welcome screen animations...");

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector('[data-testid="welcome-screen"]', {
      timeout: 10000,
    });

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
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.reload();
    await page.waitForSelector('[data-testid="welcome-screen"]', {
      timeout: 15000,
    });
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
    await settingsButton.click({ force: true });
    // Wait for dialog content
    const settingsTitle = page.locator("text=Settings / การตั้งค่า");
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

    // Close settings (click close button)
    const closeBtn = page.getByRole("button", { name: "Close" });
    await closeBtn.waitFor({ state: "visible", timeout: 10000 });
    await closeBtn.click({ force: true });
    await settingsTitle.waitFor({ state: "detached", timeout: 10000 });

    // 3. Level Select
    console.log("Going to Level Select...");
    const levelSelectButton = page.locator(
      '[data-testid="level-select-button"]',
    );
    await levelSelectButton.waitFor({ state: "visible", timeout: 10000 });
    await levelSelectButton.click({ force: true });
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
      await levelButtons.nth(i).click({ force: true });

      // Click Start Game
      const startGameBtn = page.locator('[data-testid="start-button"]');
      await startGameBtn.waitFor({ state: "visible", timeout: 5000 });
      await startGameBtn.click({ force: true });

      // Handle Worm Loading Screen (Skip it)
      try {
        const loadingScreen = page.locator(
          '[data-testid="worm-loading-screen"]',
        );
        const skipBtn = page.locator('[data-testid="skip-loading-button"]');

        // Wait briefly to see if loading screen appears
        await page.waitForTimeout(200);

        if ((await loadingScreen.count()) > 0) {
          await skipBtn.waitFor({ state: "visible", timeout: 10000 });
          await skipBtn.click({ force: true });
          await loadingScreen.waitFor({ state: "detached", timeout: 15000 });
        }
      } catch (e) {
        console.log("Loading screen skip bypassed in screenshot loop");
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
      const backBtn = page.locator('[data-testid="back-button"]');
      await backBtn.waitFor({ state: "visible", timeout: 5000 });
      await backBtn.click({ force: true });

      // We are now at Main Menu
      await page.waitForSelector('[data-testid="game-menu"]');
      // Small delay to ensure menu is fully interactive
      await page.waitForTimeout(300);

      // Go back to Level Select for next iteration
      const levelSelectBtn = page.locator(
        '[data-testid="level-select-button"]',
      );
      await levelSelectBtn.waitFor({ state: "visible", timeout: 5000 });
      await levelSelectBtn.click({ force: true });
      await page.waitForSelector('[data-testid="level-select-menu"]');
    }

    console.log("All screenshots captured.");
  });
});
