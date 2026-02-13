type DisplayAdjustmentCause =
  | "initialization"
  | "resize"
  | "orientation"
  | "fullscreen"
  | "programmatic";

export interface DisplayAdjustmentSignalDetail {
  cause: DisplayAdjustmentCause;
  timestamp: number;
}

const DISPLAY_ADJUSTMENT_EVENT = "k1-display-adjustment";
const LAST_SIGNAL_KEY = "__K1_LAST_DISPLAY_ADJUSTMENT__";

type BrowserWindow = Window & {
  [LAST_SIGNAL_KEY]?: DisplayAdjustmentSignalDetail;
};

const getBrowserWindow = (): BrowserWindow | null => {
  if (typeof window === "undefined") return null;
  return window as BrowserWindow;
};

export function emitDisplayAdjustmentSignal(
  cause: DisplayAdjustmentCause,
): DisplayAdjustmentSignalDetail {
  const detail: DisplayAdjustmentSignalDetail = {
    cause,
    timestamp: Date.now(),
  };

  const browserWindow = getBrowserWindow();
  if (!browserWindow) return detail;

  browserWindow[LAST_SIGNAL_KEY] = detail;
  browserWindow.dispatchEvent(
    new CustomEvent(DISPLAY_ADJUSTMENT_EVENT, { detail }),
  );

  return detail;
}

export function getLastDisplayAdjustmentSignal(): DisplayAdjustmentSignalDetail | null {
  const browserWindow = getBrowserWindow();
  return browserWindow?.[LAST_SIGNAL_KEY] ?? null;
}

export function subscribeDisplayAdjustmentSignal(
  handler: (detail: DisplayAdjustmentSignalDetail) => void,
  options: { replayLatest?: boolean } = {},
): () => void {
  const browserWindow = getBrowserWindow();
  if (!browserWindow) return () => undefined;

  const wrappedHandler = (event: Event) => {
    const detail =
      event instanceof CustomEvent
        ? (event.detail as DisplayAdjustmentSignalDetail)
        : getLastDisplayAdjustmentSignal();
    if (detail) handler(detail);
  };

  browserWindow.addEventListener(DISPLAY_ADJUSTMENT_EVENT, wrappedHandler);

  if (options.replayLatest) {
    const latest = getLastDisplayAdjustmentSignal();
    if (latest) handler(latest);
  }

  return () => {
    browserWindow.removeEventListener(DISPLAY_ADJUSTMENT_EVENT, wrappedHandler);
  };
}
