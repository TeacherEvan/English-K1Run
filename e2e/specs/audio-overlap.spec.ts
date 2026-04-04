import { expect, test } from "../fixtures/game.fixture";
import {
  clearTrackedAudioEvents,
  readAudioDiagnostics,
  waitForAudioIdle,
  waitForAudioTracker,
} from "../helpers/audio-diagnostics";

test.describe("Audio overlap", () => {
  test("welcome cues do not overlap", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    await page.waitForSelector('[data-testid="welcome-screen"]', {
      timeout: 10000,
    });
    await page.waitForSelector('[data-testid="welcome-language-picker"]', {
      state: "visible",
      timeout: 10000,
    });
    await page.waitForSelector('[data-testid="welcome-language-en"]', {
      state: "visible",
      timeout: 10000,
    });

    await waitForAudioTracker(page);
    await clearTrackedAudioEvents(page);

    await page.click('[data-testid="welcome-language-en"]', {
      force: true,
    });

    await page.waitForSelector('[data-testid="welcome-language-shell"]', {
      state: "detached",
      timeout: 10000,
    });

    await waitForAudioIdle(page);

    const diagnostics = await readAudioDiagnostics(page, 25);

    expect(diagnostics.history.length).toBeGreaterThan(0);
    expect(diagnostics.stats.totalAttempts).toBeGreaterThan(0);
    expect(diagnostics.stats.successful).toBeGreaterThan(0);
    expect(diagnostics.trackerEvents.length).toBeGreaterThan(0);
    expect(diagnostics.history.some((event) => event.success)).toBe(true);
    if (diagnostics.debug) {
      expect(diagnostics.debug.peak).toBeLessThanOrEqual(1);
    }
    expect(
      diagnostics.trackerEvents.every(
        (event) => event.category === "audio_playback",
      ),
    ).toBe(true);
  });
});
