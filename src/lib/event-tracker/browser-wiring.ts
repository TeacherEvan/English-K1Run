import type { EventTracker } from "./event-tracker";

const safeString = (value: unknown) => (typeof value === "string" ? value : "");

export const attachGlobalErrorHandlers = (tracker: EventTracker) => {
  if (typeof window === "undefined" || !window.addEventListener) return;

  window.addEventListener("error", (event) => {
    try {
      tracker.trackEvent({
        type: "error",
        category: "javascript",
        message: safeString((event as ErrorEvent).message) || "Unknown error",
        data: {
          filename: (event as ErrorEvent).filename,
          lineno: (event as ErrorEvent).lineno,
          colno: (event as ErrorEvent).colno,
        },
        stackTrace: (event as ErrorEvent).error?.stack,
      });
    } catch {
      // never crash the app due to telemetry
    }
  });

  window.addEventListener("unhandledrejection", (event) => {
    try {
      const reason = (event as PromiseRejectionEvent).reason as unknown;
      tracker.trackEvent({
        type: "error",
        category: "promise",
        message: "Unhandled promise rejection",
        data: { reason },
        stackTrace: (reason as { stack?: string } | null)?.stack,
      });
    } catch {
      // never crash the app due to telemetry
    }
  });
};

export const exposeTrackerForDebugging = (tracker: EventTracker) => {
  if (typeof window === "undefined") return;
  try {
    (window as Window & { gameEventTracker?: EventTracker }).gameEventTracker =
      tracker;
  } catch {
    // ignore
  }
};
