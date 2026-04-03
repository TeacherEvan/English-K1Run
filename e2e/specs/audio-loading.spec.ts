import { expect, test } from "../fixtures/game.fixture";

const CRITICAL_WELCOME_ASSETS = [
  "welcome.wav",
  "welcome_evan_intro.wav",
  "welcome_sangsom_association.wav",
  "welcome_sangsom_association_thai.wav",
] as const;

const AUDIO_WARNING_PATTERN =
  /No URL found|Failed to resolve URL|No public audio file found/i;

test.describe("Audio loading", () => {
  test("serves critical welcome audio assets from /sounds", async ({ page }) => {
    await page.goto("/?e2e=1", { waitUntil: "domcontentloaded" });

    const failedAssets = await page.evaluate(async (assets) => {
      const results = await Promise.all(
        assets.map(async (asset) => {
          const response = await fetch(`/sounds/${asset}`, { method: "HEAD" });
          return response.ok ? null : `${asset} (${response.status})`;
        }),
      );

      return results.filter((asset): asset is string => asset !== null);
    }, [...CRITICAL_WELCOME_ASSETS]);

    expect(failedAssets).toEqual([]);
  });

  test("avoids audio 404s during menu and gameplay startup", async ({
    gamePage,
  }) => {
    const failedRequests: string[] = [];

    gamePage.page.on("response", (response) => {
      if (response.status() !== 404 || !response.url().includes("/sounds/")) {
        return;
      }

      failedRequests.push(new URL(response.url()).pathname);
    });

    await gamePage.goto();
    await gamePage.waitForReady();
    await gamePage.menu.startGame();
    await gamePage.page.waitForTimeout(1500);

    expect(failedRequests).toEqual([]);
  });

  test("avoids audio resolution warnings during menu and gameplay startup", async ({
    gamePage,
  }) => {
    const audioWarnings: string[] = [];

    gamePage.page.on("console", (message) => {
      if (
        (message.type() === "warning" || message.type() === "error") &&
        AUDIO_WARNING_PATTERN.test(message.text())
      ) {
        audioWarnings.push(message.text());
      }
    });

    await gamePage.goto();
    await gamePage.waitForReady();
    await gamePage.menu.startGame();
    await gamePage.page.waitForTimeout(1500);

    expect(audioWarnings).toEqual([]);
  });
});
