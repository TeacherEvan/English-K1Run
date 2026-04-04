import { expect, test } from "@playwright/test";

test.describe("Welcome layout", () => {
  test("desktop keeps welcome controls off the hero center", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1365, height: 768 });
    await page.goto("/");

    const welcomeScreen = page.locator('[data-testid="welcome-screen"]');
    const video = page.locator('[data-testid="welcome-video"]');
    const languageShell = page.locator(
      '[data-testid="welcome-language-shell"]',
    );
    const statusPanel = page.locator('[data-testid="welcome-status-panel"]');

    await expect(welcomeScreen).toBeVisible();
    await expect(video).toBeVisible();
    await expect(languageShell).toBeVisible();
    await expect(statusPanel).toBeVisible();

    const viewport = page.viewportSize();
    const languageBox = await languageShell.boundingBox();
    const statusBox = await statusPanel.boundingBox();

    expect(viewport).toBeTruthy();
    expect(languageBox).toBeTruthy();
    expect(statusBox).toBeTruthy();

    expect(languageBox!.x).toBeGreaterThan(viewport!.width * 0.55);
    expect(statusBox!.x).toBeGreaterThan(viewport!.width * 0.5);
    expect(languageBox!.width).toBeLessThan(340);
    expect(statusBox!.width).toBeLessThan(400);
  });

  test("desktop removes the startup language chooser after a selection", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1365, height: 768 });
    await page.goto("/");

    const welcomeScreen = page.locator('[data-testid="welcome-screen"]');
    const video = page.locator('[data-testid="welcome-video"]');
    const languageShell = page.locator(
      '[data-testid="welcome-language-shell"]',
    );
    const thaiButton = page.locator('[data-testid="welcome-language-th"]');
    const statusPanel = page.locator('[data-testid="welcome-status-panel"]');
    const primaryButton = page.locator(
      '[data-testid="welcome-primary-button"]',
    );

    await expect(welcomeScreen).toBeVisible();
    await expect(video).toBeVisible();
    await expect(languageShell).toBeVisible();
    await expect(statusPanel).toBeVisible();

    await thaiButton.click();

    await expect(languageShell).toHaveCount(0);
    await expect(statusPanel).toBeVisible();
    await expect(primaryButton).toBeVisible();
    await expect(video).toBeVisible();

    const viewport = page.viewportSize();
    const statusBox = await statusPanel.boundingBox();

    expect(viewport).toBeTruthy();
    expect(statusBox).toBeTruthy();
    expect(statusBox!.x).toBeGreaterThan(viewport!.width * 0.5);
  });

  test("mobile keeps welcome controls stacked and centered", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    const languageShell = page.locator(
      '[data-testid="welcome-language-shell"]',
    );
    const statusPanel = page.locator('[data-testid="welcome-status-panel"]');

    await expect(languageShell).toBeVisible();
    await expect(statusPanel).toBeVisible();

    const languageBox = await languageShell.boundingBox();
    const statusBox = await statusPanel.boundingBox();

    expect(languageBox).toBeTruthy();
    expect(statusBox).toBeTruthy();

    const languageCenter = languageBox!.x + languageBox!.width / 2;
    const statusCenter = statusBox!.x + statusBox!.width / 2;

    expect(Math.abs(languageCenter - 195)).toBeLessThan(40);
    expect(Math.abs(statusCenter - 195)).toBeLessThan(40);
    expect(statusBox!.y).toBeGreaterThan(languageBox!.y);
  });
});
