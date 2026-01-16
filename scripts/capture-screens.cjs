const { chromium } = require("playwright");
const fs = require("fs");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1280, height: 720 },
  });

  console.log("Navigating to game with E2E flag...");
  await page.goto("http://localhost:5174/?e2e=1", { waitUntil: "networkidle" });

  try {
    console.log("Waiting for game menu...");
    await page.waitForSelector('[data-testid="game-menu"]', { timeout: 10000 });
    await page.screenshot({ path: "test-results/5_final_menu.png" });

    console.log("Clicking New Game...");
    await page.getByTestId("new-game-button").evaluate((el) => el.click());

    console.log("Waiting for level select menu...");
    await page.waitForSelector('[data-testid="level-select-menu"]', {
      timeout: 10000,
    });
    await page.screenshot({ path: "test-results/6_final_level_select.png" });

    console.log("SUCCESS: All screens captured.");
  } catch (e) {
    console.error("FAILED AT STEP:", e.message);
    await page.screenshot({ path: "test-results/failure.png" });
    const html = await page.content();
    fs.writeFileSync("test-results/failure-source.html", html);
  }

  await browser.close();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
