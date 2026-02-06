/**
 * Telemetry and debug logging for touch handling.
 */

import { eventTracker } from "../event-tracker";
import type { TouchHandlerOptions } from "./types";

type TouchEventPayload = Parameters<typeof eventTracker.trackEvent>[0];

export interface TouchTelemetry {
  track: (event: TouchEventPayload) => void;
  log: (...args: unknown[]) => void;
}

export const createTouchTelemetry = (
  options: Required<TouchHandlerOptions>,
): TouchTelemetry => {
  const shouldTrack = options.debug || import.meta.env.DEV;

  const track = (event: TouchEventPayload) => {
    if (!shouldTrack) return;
    eventTracker.trackEvent(event);
  };

  const log = (...args: unknown[]) => {
    if (!options.debug) return;
    console.log(...args);
  };

  return { track, log };
};
