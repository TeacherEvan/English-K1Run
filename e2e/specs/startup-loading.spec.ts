import { expect, test } from "@playwright/test";

test.describe("Startup loading", () => {
  test("shows the branded boot loader before welcome on first launch", async ({
    page,
  }) => {
    await page.route("**/New_welcome_video.mp4", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 200));
      await route.continue();
    });

    await page.goto("/");

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
  });
});
