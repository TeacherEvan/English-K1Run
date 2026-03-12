import { expect, test } from "@playwright/test";

const deploymentUrl = process.env.PLAYWRIGHT_DEPLOYMENT_URL;
const deploymentSkipReason =
  "Set PLAYWRIGHT_DEPLOYMENT_URL to run deployment diagnostics against a deployed app.";

const gotoDeployment = async (page: import("@playwright/test").Page) => {
  await page.goto(deploymentUrl!, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });

  await expect(page.locator("#root")).toHaveCount(1, {
    timeout: 15000,
  });

  await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {
    console.log("ℹ️ Deployment diagnostics continuing before networkidle");
  });
};

test.describe("Deployment Diagnostics", () => {
  test.skip(!deploymentUrl, deploymentSkipReason);

  test("should load without JavaScript errors", async ({ page }) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Listen for console errors and warnings
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      } else if (msg.type() === "warning") {
        warnings.push(msg.text());
      }
    });

    // Listen for page errors
    page.on("pageerror", (error) => {
      errors.push(`Page error: ${error.message}`);
    });

    await gotoDeployment(page);

    // Check for critical JavaScript errors
    const criticalErrors = errors.filter(
      (error) =>
        error.includes("Uncaught TypeError: R is not a function") ||
        error.includes("vendor-misc") ||
        error.includes("Circular dependency") ||
        error.includes("Cannot read property") ||
        error.includes("is not defined"),
    );

    // Log all errors for debugging
    console.log("Console Errors:", errors);
    console.log("Console Warnings:", warnings);
    console.log("Critical Errors:", criticalErrors);

    // Assert no critical JavaScript errors
    expect(criticalErrors).toHaveLength(0);

    try {
      await Promise.race([
        page.locator('[data-testid="game-menu"]').waitFor({
          state: "visible",
          timeout: 10000,
        }),
        page.locator('[data-testid="welcome-screen"]').waitFor({
          state: "visible",
          timeout: 10000,
        }),
      ]);
      console.log("✅ App shell loaded successfully");
    } catch {
      console.log("❌ App shell did not appear within timeout");
    }
  });

  test("should load all JavaScript bundles successfully", async ({ page }) => {
    const failedRequests: string[] = [];

    // Track failed requests
    page.on("response", (response) => {
      if (!response.ok() && response.url().includes(".js")) {
        failedRequests.push(`${response.status()}: ${response.url()}`);
      }
    });

    await gotoDeployment(page);

    console.log("Failed JS requests:", failedRequests);

    // Should have no failed JavaScript bundle requests
    const bundleFailures = failedRequests.filter(
      (req) =>
        req.includes("vendor-") ||
        req.includes("app-") ||
        req.includes("index-"),
    );

    expect(bundleFailures).toHaveLength(0);
  });

  test("should load CSS files successfully", async ({ page }) => {
    const failedRequests: string[] = [];

    page.on("response", (response) => {
      if (!response.ok() && response.url().includes(".css")) {
        failedRequests.push(`${response.status()}: ${response.url()}`);
      }
    });

    await gotoDeployment(page);

    console.log("Failed CSS requests:", failedRequests);

    // Should have no failed CSS requests
    expect(failedRequests).toHaveLength(0);
  });

  test("welcome audio cues should not overlap", async ({ page }) => {
    await gotoDeployment(page);

    await page.waitForSelector('[data-testid="welcome-screen"]', {
      timeout: 10000,
    });

    await page.click('[data-testid="welcome-screen"]');

    const hasAudioDebug = await page.evaluate(() => "__audioDebug" in window);
    test.skip(
      !hasAudioDebug,
      "Audio debug counters not available on deployed build.",
    );

    await page.waitForFunction(
      () =>
        (window as unknown as { __audioDebug?: { active: number } })
          .__audioDebug?.active !== undefined,
      undefined,
      { timeout: 10000 },
    );

    await page.waitForFunction(
      () =>
        (window as unknown as { __audioDebug?: { active: number } })
          .__audioDebug?.active === 0,
      undefined,
      { timeout: 40000 },
    );

    const peak = await page.evaluate(() => {
      const debug = (window as unknown as { __audioDebug?: { peak: number } })
        .__audioDebug;
      return debug?.peak ?? 0;
    });

    // Allow up to 2 concurrent audio cues (welcome screen + background music)
    expect(peak).toBeLessThanOrEqual(2);
  });
});
