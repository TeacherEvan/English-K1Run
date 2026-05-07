import { expect, test } from "../fixtures/game.fixture";

test("selected level transitions after 10 registered clears", async ({
  gamePage,
  page,
}, testInfo) => {
  await gamePage.goto();
  await gamePage.waitForReady();
  await gamePage.menu.startGame();
  await gamePage.gameplay.targetDisplay.waitFor({ state: "visible" });
  await gamePage.gameplay.waitForObjectsToSpawn(1);

  const levelCompletePopup = page.locator('[data-testid="level-complete-popup"]');
  const levelCompletePanel = page.locator(
    '[data-testid="level-complete-popup-card"]',
  );
  const levelCountdownOverlay = page.locator(
    '[data-testid="level-countdown-overlay"]',
  );
  const levelCountdownShell = levelCountdownOverlay.locator(
    '.level-countdown-shell',
  );

  for (let tap = 0; tap < 10; tap += 1) {
    const resolution =
      await gamePage.gameplay.tapCurrentTargetAndWaitForResolution();

    if (tap === 9) {
      expect(resolution).toBe("popup");
      await expect(levelCompletePopup).toBeVisible();

      if (testInfo.project.name === "visual") {
        await page.addStyleTag({
          content: `
            [data-testid="level-complete-popup-card"] {
              backdrop-filter: none !important;
              -webkit-backdrop-filter: none !important;
              background: oklch(0.98 0.04 95) !important;
              border-radius: 0 !important;
              box-shadow: none !important;
            }
          `,
        });

        await expect(levelCompletePanel).toHaveScreenshot(
          "level-complete-popup.png",
          {
            animations: "disabled",
            caret: "hide",
            maxDiffPixels: 500,
          },
        );
      }
    }

    if (tap < 9) {
      await gamePage.gameplay.waitForObjectsToSpawn(1);
    }
  }

  await expect(levelCountdownOverlay).toBeVisible({
    timeout: 8_000,
  });

  if (testInfo.project.name === "visual") {
    await page.addStyleTag({
      content: `
        [data-testid="level-countdown-value"],
        .level-countdown-support {
          color: transparent !important;
          text-shadow: none !important;
        }

        [data-testid="level-countdown-overlay"] .level-countdown-shell {
          border-radius: 0 !important;
          box-shadow: none !important;
        }

        .level-countdown-progress-bar {
          transform: scaleX(0.5) !important;
          transition: none !important;
        }
      `,
    });

    await expect(levelCountdownShell).toHaveScreenshot(
      "level-countdown-overlay.png",
      {
        animations: "disabled",
        caret: "hide",
        maxDiffPixels: 2000,
      },
    );
  }

  await expect(
    page.locator('[data-testid="default-completion-dialog"]'),
  ).toHaveCount(0);
});
