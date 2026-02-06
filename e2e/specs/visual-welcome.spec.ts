import { test } from "@playwright/test";

test.describe("Visual Screenshots - Welcome", () => {
  test.slow();
  test("Capture welcome screen with animations", async ({ page }, testInfo) => {
    console.log("Testing welcome screen animations...");

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector('[data-testid="welcome-screen"]', {
      timeout: 10000,
    });

    await page.waitForTimeout(1000);

    const welcomeInitial = await page.screenshot({
      path: testInfo.outputPath("welcome-screen-initial.png"),
    });
    await testInfo.attach("Welcome Screen - Initial", {
      body: welcomeInitial,
      contentType: "image/png",
    });

    await page.waitForTimeout(8500);

    const welcomeAnimated = await page.screenshot({
      path: testInfo.outputPath("welcome-screen-animated.png"),
    });
    await testInfo.attach("Welcome Screen - With Animations", {
      body: welcomeAnimated,
      contentType: "image/png",
    });

    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.reload({ waitUntil: "domcontentloaded", timeout: 60000 });
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
});
