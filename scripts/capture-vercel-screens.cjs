const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

(async () => {
  let browser;
  try {
    browser = await chromium.launch();
    const page = await browser.newPage({
      viewport: { width: 1365, height: 768 },
    });

    const outputDir = path.resolve(__dirname, "..", "test-results");
    fs.mkdirSync(outputDir, { recursive: true });

    const baseUrl = "https://english-k1-run.vercel.app/?e2e=1";
    console.log(`Navigating to ${baseUrl}`);
    await page.goto(baseUrl, { waitUntil: "networkidle" });

    console.log("Waiting for main menu...");
    await page.waitForSelector('[data-testid="game-menu"]', { timeout: 20000 });
    await page.waitForSelector('[data-testid="start-game-button"]', {
      timeout: 20000,
    });

    const mainMenuPath = path.join(outputDir, "main-menu.png");
    await page.screenshot({ path: mainMenuPath, fullPage: true });
    console.log(`Saved ${mainMenuPath}`);

    console.log("Opening level select...");
    await page.getByTestId("level-select-button").evaluate((el) => el.click());
    await page.waitForSelector('[data-testid="level-select-menu"]', {
      timeout: 20000,
    });

    const levelSelectPath = path.join(outputDir, "level-select.png");
    await page.screenshot({ path: levelSelectPath, fullPage: true });
    console.log(`Saved ${levelSelectPath}`);
  } catch (error) {
    console.error("Failed to capture Vercel screenshots:", error);
    process.exitCode = 1;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
})();
