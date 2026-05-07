import type { Page } from "@playwright/test";
import { expect, test } from "../fixtures/game.fixture";

async function gotoWelcome(page: Page) {
  await page.goto("/", { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.evaluate(() => {
    localStorage.removeItem("k1-settings");
    localStorage.removeItem("k1-language");
  });
  await page.reload({ waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForSelector('[data-testid="welcome-screen"]', {
    timeout: 15_000,
  });
}

test.describe("Welcome design alignment", () => {
  test.beforeEach(async ({ page, audioMock }) => {
    void audioMock;
    await page.emulateMedia({ reducedMotion: "reduce" });
    await gotoWelcome(page);
  });

  test("keeps first launch focused on language choice only", async ({
    page,
  }) => {
    await expect(page.getByTestId("welcome-language-shell")).toBeVisible();
    await expect(page.getByTestId("welcome-status-panel")).toHaveCount(0);
    await expect(page.getByTestId("welcome-primary-button")).toHaveCount(0);
  });

  test("keeps the language shell visible inside the mobile viewport", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoWelcome(page);
    await expect(page.getByTestId("welcome-language-shell")).toBeVisible();

    const box = await page.getByTestId("welcome-language-shell").boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(390);
  });

  test("stays readable when reduced motion is enabled", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await gotoWelcome(page);

    await expect(page.getByTestId("welcome-language-shell")).toBeVisible();
    await expect(page.getByTestId("welcome-status-panel")).toHaveCount(0);
    await expect(page.getByTestId("welcome-primary-button")).toHaveCount(0);
  });
});
