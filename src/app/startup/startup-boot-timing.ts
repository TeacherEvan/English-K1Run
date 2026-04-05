export const STARTUP_BOOT_MIN_MS = 2400;
export const STARTUP_BOOT_READY_SETTLE_MS = 150;

const wait = (ms: number) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });

export const waitForStartupBootReady = async (startedAt: number) => {
  const elapsedMs = Date.now() - startedAt;
  const remainingMs = Math.max(STARTUP_BOOT_MIN_MS - elapsedMs, 0);

  if (remainingMs > 0) {
    await wait(remainingMs);
  }

  if (STARTUP_BOOT_READY_SETTLE_MS > 0) {
    await wait(STARTUP_BOOT_READY_SETTLE_MS);
  }
};
