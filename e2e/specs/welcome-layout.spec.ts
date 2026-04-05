import { expect, test } from "@playwright/test";

async function waitForWelcomeToAdvance(page: import("@playwright/test").Page) {
  await expect
    .poll(
      async () => {
        const phase = await page
          .getByTestId("welcome-screen")
          .getAttribute("data-welcome-phase");
        return phase === "playingNarration" || phase === "readyToContinue";
      },
      { timeout: 20_000 },
    )
    .toBe(true);
}

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

    await expect(welcomeScreen).toBeVisible();
    await expect(video).toBeVisible();
    await expect(languageShell).toBeVisible();
    await expect(statusPanel).toBeVisible();

    await thaiButton.click();

    await expect(languageShell).toHaveCount(0);
    await expect(video).toBeVisible();
    await expect(statusPanel).toHaveCount(0);

    await waitForWelcomeToAdvance(page);
    await expect
      .poll(() => welcomeScreen.getAttribute("data-welcome-phase"), {
        timeout: 5_000,
      })
      .toMatch(/playingNarration|readyToContinue/);
  });

  test("startup hides the language chooser after selection and keeps intro content visible", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    const welcomeScreen = page.locator('[data-testid="welcome-screen"]');
    const languageShell = page.locator(
      '[data-testid="welcome-language-shell"]',
    );
    const thaiButton = page.locator('[data-testid="welcome-language-th"]');
    const video = page.locator('[data-testid="welcome-video"]');
    const statusPanel = page.locator('[data-testid="welcome-status-panel"]');

    await expect(welcomeScreen).toBeVisible();
    await expect(languageShell).toBeVisible();
    await expect(video).toBeVisible();
    await expect(statusPanel).toBeVisible();

    await thaiButton.click();

    await expect(languageShell).toHaveCount(0);
    await expect(video).toBeVisible();
    await expect(statusPanel).toHaveCount(0);
  });

  test("desktop keeps the intro nearly unobstructed after language selection", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1365, height: 768 });
    await page.goto("/");

    const languageShell = page.locator(
      '[data-testid="welcome-language-shell"]',
    );
    const thaiButton = page.locator('[data-testid="welcome-language-th"]');
    const video = page.locator('[data-testid="welcome-video"]');
    const statusPanel = page.locator('[data-testid="welcome-status-panel"]');

    await expect(languageShell).toBeVisible();

    await thaiButton.click();

    await expect(languageShell).toHaveCount(0);
    await expect(video).toBeVisible();
    await expect(statusPanel).toHaveCount(0);
  });

  test("shows only the Sangsom fallback image when the intro video request fails", async ({
    page,
  }) => {
    await page.route("**/New_welcome_video.mp4", (route) => route.abort());
    await page.setViewportSize({ width: 1365, height: 768 });
    await page.goto("/");

    const englishButton = page.locator('[data-testid="welcome-language-en"]');
    const languageShell = page.locator(
      '[data-testid="welcome-language-shell"]',
    );
    const fallback = page.locator('[data-testid="welcome-screen-fallback"]');
    const statusPanel = page.locator('[data-testid="welcome-status-panel"]');

    await englishButton.click();

    await expect(languageShell).toHaveCount(0);
    await expect(fallback).toBeVisible();
    await expect(statusPanel).toHaveCount(0);
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
