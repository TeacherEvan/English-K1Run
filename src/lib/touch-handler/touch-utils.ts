/**
 * Geometry helpers for touch validation.
 */

import type { TouchHandlerOptions } from "./types";

export const getTouchMovement = (
  touch: Touch,
  startX: number,
  startY: number,
) => {
  const deltaX = Math.abs(touch.clientX - startX);
  const deltaY = Math.abs(touch.clientY - startY);
  const movement = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

  return { deltaX, deltaY, movement };
};

export const isValidTap = (
  durationMs: number,
  movementPx: number,
  options: Required<TouchHandlerOptions>,
) =>
  durationMs < options.tapThresholdMs &&
  movementPx < options.movementThresholdPx;
