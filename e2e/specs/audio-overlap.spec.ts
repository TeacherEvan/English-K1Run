import { expect, test } from "@playwright/test";

test.describe("Audio overlap", () => {
  test("welcome cues do not overlap", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    await page.waitForSelector('[data-testid="welcome-screen"]', {
      timeout: 10000,
    });

    await page.click('[data-testid="welcome-screen"]');

    await page.waitForFunction(() => "__audioDebug" in window, undefined, {
      timeout: 10000,
    });

    await page.waitForFunction(
      () =>
        (window as unknown as { __audioDebug?: { active: number } })
          .__audioDebug?.active === 0,
      undefined,
      { timeout: 20000 },
    );

    const peak = await page.evaluate(() => {
      const debug = (window as unknown as { __audioDebug?: { peak: number } })
        .__audioDebug;
      return debug?.peak ?? 0;
    });

    expect(peak).toBeLessThanOrEqual(1);
  });
});
