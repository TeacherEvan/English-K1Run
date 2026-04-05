import { expect, test } from "@playwright/test";

test.describe("Startup loading", () => {
  test("shows the branded boot loader before welcome on first launch", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.removeItem("k1-startup-state");
    });

    await page.route("**/welcome-sangsom.png", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await route.continue();
    });

    await page.route("**/New_welcome_video.mp4", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await route.continue();
    });

    await page.goto("/", { waitUntil: "domcontentloaded" });

    await expect(
      page.locator('[data-testid="startup-loading-screen"]'),
    ).toBeVisible();
    await page.waitForTimeout(1000);
    await expect(
      page.locator('[data-testid="startup-loading-screen"]'),
    ).toBeVisible();
    await expect(page.locator('[data-testid="welcome-screen"]')).toBeVisible();
  });

  test("skips the startup chooser after the language gate was already completed", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        "k1-startup-state",
        JSON.stringify({
          languageGateCompleted: true,
          startupPackVersion: "startup-boot-v1",
        }),
      );
    });

    await page.goto("/");

    await expect(
      page.locator('[data-testid="welcome-language-shell"]'),
    ).toHaveCount(0);
    await expect(page.locator('[data-testid="welcome-video"]')).toBeVisible();
    await expect(
      page.locator('[data-testid="welcome-status-panel"]'),
    ).toBeVisible();
  });
});
