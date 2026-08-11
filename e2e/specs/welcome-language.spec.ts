import { expect, test } from "../fixtures/game.fixture";

const THAI_LANGUAGE_TITLE = "เลือกภาษาของคุณ";
const THAI_READY_PROMPT = /แตะ.*เริ่ม/;

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

    await expect(
      page.getByText("Choose your language", { exact: true }),
    ).toBeVisible();
    await expect(englishButton).toBeEnabled();
    await expect(thaiButton).toBeEnabled();
    await expect(thaiButton).toHaveAttribute("aria-pressed", "false");

    await thaiButton.click();

    await expect(
      page.getByText(THAI_LANGUAGE_TITLE, { exact: true }),
    ).toBeVisible();
    await expect(page.getByTestId("welcome-status-label")).toContainText(
      THAI_READY_PROMPT,
    );
    await expect(thaiButton).toHaveAttribute("aria-pressed", "true");

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

    await page
      .getByTestId("welcome-primary-button")
      .evaluate((element: HTMLElement) => {
        element.click();
      });

    await expect
      .poll(
        () =>
          page.getByTestId("welcome-screen").getAttribute("data-welcome-phase"),
        { timeout: 20_000 },
      )
      .toBe("playingNarration");

    await expect(englishButton).toBeDisabled();
    await expect(thaiButton).toBeDisabled();
  });

  test("keeps Thai selected after reload and carries it into the menu", async ({
    page,
  }) => {
    await page.getByTestId("welcome-language-th").click();
    await page.reload({ waitUntil: "domcontentloaded", timeout: 60_000 });

    const thaiButton = page.getByTestId("welcome-language-th");
    await page.waitForSelector('[data-testid="welcome-language-picker"]', {
      timeout: 15_000,
    });
    await expect(thaiButton).toHaveAttribute("aria-pressed", "true");
    await expect(
      page.getByText(THAI_LANGUAGE_TITLE, { exact: true }),
    ).toBeVisible();

    await page
      .getByTestId("welcome-primary-button")
      .evaluate((element: HTMLElement) => {
        element.click();
      });
    await expect
      .poll(
        () =>
          page.getByTestId("welcome-screen").getAttribute("data-welcome-phase"),
        { timeout: 20_000 },
      )
      .toBe("readyToContinue");

    await page
      .getByTestId("welcome-primary-button")
      .evaluate((element: HTMLElement) => {
        element.click();
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
