import type { Page } from "@playwright/test";
import { expect, test } from "../fixtures/game.fixture";

async function waitForWelcomeToAdvance(page: Page) {
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

test.describe("Welcome language picker", () => {
  test.beforeEach(async ({ page, audioMock }) => {
    void audioMock;
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/", { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.evaluate(() => {
      localStorage.removeItem("k1-settings");
      localStorage.removeItem("k1-language");
    });
    await page.reload({ waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.waitForSelector('[data-testid="welcome-screen"]', {
      timeout: 15_000,
    });
    await page.waitForSelector('[data-testid="welcome-language-picker"]', {
      timeout: 15_000,
    });
  });

  test("lets players pick Thai before welcome audio begins", async ({
    page,
  }) => {
    const englishButton = page.getByTestId("welcome-language-en");
    const thaiButton = page.getByTestId("welcome-language-th");
    const languagePicker = page.getByTestId("welcome-language-picker");

    await expect(languagePicker).toBeVisible();
    await expect(englishButton).toBeEnabled();
    await expect(thaiButton).toBeEnabled();
    await expect(thaiButton).toHaveAttribute("aria-pressed", "false");

    await thaiButton.click();

    await expect(languagePicker).toHaveCount(0);

    await expect
      .poll(() =>
        page.evaluate(() => {
          const settings = JSON.parse(
            localStorage.getItem("k1-settings") ?? "{}",
          ) as {
            displayLanguage?: string;
            gameplayLanguage?: string;
          };
          return {
            displayLanguage: settings.displayLanguage,
            gameplayLanguage: settings.gameplayLanguage,
            persistedLanguage: localStorage.getItem("k1-language"),
          };
        }),
      )
      .toEqual({
        displayLanguage: "th",
        gameplayLanguage: "th",
        persistedLanguage: "th",
      });

    await waitForWelcomeToAdvance(page);
  });

  test("keeps Thai selected after reload and carries it into the menu", async ({
    page,
  }) => {
    await page.getByTestId("welcome-language-th").click();
    await page.reload({ waitUntil: "domcontentloaded", timeout: 60_000 });

    const languagePicker = page.getByTestId("welcome-language-picker");
    await expect(languagePicker).toHaveCount(0);
    await expect(page.getByTestId("welcome-primary-button")).toBeVisible();

    await expect
      .poll(() =>
        page.evaluate(() => {
          const settings = JSON.parse(
            localStorage.getItem("k1-settings") ?? "{}",
          ) as {
            displayLanguage?: string;
            gameplayLanguage?: string;
          };
          return {
            displayLanguage: settings.displayLanguage,
            gameplayLanguage: settings.gameplayLanguage,
            persistedLanguage: localStorage.getItem("k1-language"),
            languageGateCompleted: (JSON.parse(
              localStorage.getItem("k1-startup-state") ?? "{}",
            ) as { languageGateCompleted?: boolean }).languageGateCompleted,
          };
        }),
      )
      .toEqual({
        displayLanguage: "th",
        gameplayLanguage: "th",
        persistedLanguage: "th",
        languageGateCompleted: true,
      });

    await page.getByTestId("welcome-primary-button").click({ force: true });
    await waitForWelcomeToAdvance(page);
    await expect
      .poll(
        () =>
          page.getByTestId("welcome-screen").getAttribute("data-welcome-phase"),
        { timeout: 20_000 },
      )
      .toBe("readyToContinue");

    await page.waitForSelector('[data-testid="welcome-primary-button"]', {
      state: "visible",
      timeout: 20_000,
    });

    await page.getByTestId("welcome-primary-button").click({ force: true });
    await page.waitForSelector('[data-testid="welcome-screen"]', {
      state: "hidden",
      timeout: 10_000,
    });
    await page.waitForSelector('[data-testid="game-menu"]', {
      timeout: 25_000,
    });

    const startButton = page.getByTestId("start-game-button");
    await expect(
      startButton.getByText("Start Game", { exact: true }),
    ).toBeVisible();
    await expect(
      startButton.getByText("เริ่มเกม", { exact: true }),
    ).toBeVisible();
  });
});
