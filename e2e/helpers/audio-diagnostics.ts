import type { Page } from "@playwright/test";

interface AudioDebugState {
  active: number;
  current: number;
  peak: number;
  total: number;
  lastSound?: string;
}

interface AudioPlaybackHistoryEntry {
  audioKey: string;
  targetName: string;
  method: string;
  success: boolean;
  error?: string;
}

interface TrackerEventEntry {
  category: string;
  message: string;
  data?: Record<string, unknown>;
}

export interface AudioDiagnosticsSnapshot {
  debug: AudioDebugState | null;
  history: AudioPlaybackHistoryEntry[];
  stats: {
    totalAttempts: number;
    successful: number;
    failed: number;
    byMethod: Record<string, { success: number; failed: number }>;
  };
  trackerEvents: TrackerEventEntry[];
}

export async function waitForAudioTracker(page: Page, timeout = 10_000) {
  await page.waitForFunction(
    () => {
      const tracker = (
        window as Window & {
          gameEventTracker?: {
            getAudioPlaybackHistory?: (limit?: number) => unknown[];
          };
        }
      ).gameEventTracker;

      return typeof tracker?.getAudioPlaybackHistory === "function";
    },
    undefined,
    { timeout },
  );
}

export async function clearTrackedAudioEvents(page: Page) {
  await page.evaluate(() => {
    const tracker = (
      window as Window & {
        gameEventTracker?: {
          clearAudioTracking?: () => void;
          clearEvents?: () => void;
        };
      }
    ).gameEventTracker;

    tracker?.clearAudioTracking?.();
    tracker?.clearEvents?.();
  });
}

export async function waitForAudioDebug(page: Page, timeout = 10_000) {
  await page.waitForFunction(() => "__audioDebug" in window, undefined, {
    timeout,
  });
}

export async function waitForAudioIdle(page: Page, timeout = 40_000) {
  await page.waitForFunction(
    () => {
      const browserWindow = window as Window & {
        __audioDebug?: { active?: number; total?: number };
        gameEventTracker?: {
          getAudioPlaybackStats?: () => { totalAttempts?: number };
        };
      };

      const debug = browserWindow.__audioDebug;
      const totalAttempts =
        browserWindow.gameEventTracker?.getAudioPlaybackStats?.()
          .totalAttempts ?? 0;

      if (debug) {
        return (debug.total ?? 0) > 0 && (debug.active ?? 0) === 0;
      }

      return totalAttempts > 0;
    },
    undefined,
    { timeout },
  );
}

export async function readAudioDiagnostics(
  page: Page,
  limit = 20,
): Promise<AudioDiagnosticsSnapshot> {
  return page.evaluate((entryLimit: number) => {
    const browserWindow = window as Window & {
      __audioDebug?: AudioDebugState;
      gameEventTracker?: {
        getAudioPlaybackHistory?: (
          value?: number,
        ) => AudioPlaybackHistoryEntry[];
        getAudioPlaybackStats?: () => AudioDiagnosticsSnapshot["stats"];
        getEvents?: (
          type?: string,
          category?: string,
          value?: number,
        ) => TrackerEventEntry[];
      };
    };

    const tracker = browserWindow.gameEventTracker;

    return {
      debug: browserWindow.__audioDebug ?? null,
      history: tracker?.getAudioPlaybackHistory?.(entryLimit) ?? [],
      stats: tracker?.getAudioPlaybackStats?.() ?? {
        totalAttempts: 0,
        successful: 0,
        failed: 0,
        byMethod: {},
      },
      trackerEvents:
        tracker?.getEvents?.(undefined, "audio_playback", entryLimit) ?? [],
    };
  }, limit);
}
