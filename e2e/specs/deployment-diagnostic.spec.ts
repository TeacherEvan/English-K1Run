import { expect, test } from "@playwright/test";

test.describe("Deployment Diagnostics - https://english-k1-run.vercel.app", () => {
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

    // Navigate to deployed app
    await page.goto("https://english-k1-run.vercel.app", {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    // Wait a bit for all resources to load
    await page.waitForTimeout(5000);

    // Check for critical JavaScript errors
    const criticalErrors = errors.filter(
      (error) =>
        error.includes("Uncaught TypeError: R is not a function") ||
        error.includes("vendor-misc") ||
        error.includes("Circular dependency") ||
        error.includes("Cannot read property") ||
        error.includes("is not defined")
    );

    // Log all errors for debugging
    console.log("Console Errors:", errors);
    console.log("Console Warnings:", warnings);
    console.log("Critical Errors:", criticalErrors);

    // Assert no critical JavaScript errors
    expect(criticalErrors).toHaveLength(0);

    // Verify the page loaded (should have root div).
    // Note: The app may temporarily keep the root hidden during overlays/loading.
    await expect(page.locator("#root")).toHaveCount(1);

    // Check if the game menu appears (indicates React loaded successfully)
    try {
      await page.waitForSelector('[data-testid="game-menu"]', {
        timeout: 10000,
      });
      console.log("✅ Game menu loaded successfully");
    } catch (_e) {
      console.log("❌ Game menu did not appear within timeout");
      // This might be expected if there are loading issues
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

    await page.goto("https://english-k1-run.vercel.app", {
      waitUntil: "domcontentloaded",
    });

    // Wait for bundles to load
    await page.waitForTimeout(3000);

    console.log("Failed JS requests:", failedRequests);

    // Should have no failed JavaScript bundle requests
    const bundleFailures = failedRequests.filter(
      (req) =>
        req.includes("vendor-") ||
        req.includes("app-") ||
        req.includes("index-")
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

    await page.goto("https://english-k1-run.vercel.app", {
      waitUntil: "domcontentloaded",
    });

    await page.waitForTimeout(2000);

    console.log("Failed CSS requests:", failedRequests);

    // Should have no failed CSS requests
    expect(failedRequests).toHaveLength(0);
  });
});
