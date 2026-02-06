/**
 * Geometry helpers for fairy animation paths.
 */

import { FAIRY_VISUAL_CONSTANTS } from "./fairy-animation-visuals";

export const quadraticBezier = (
  t: number,
  p0: number,
  p1: number,
  p2: number,
): number => (1 - t) * (1 - t) * p0 + 2 * (1 - t) * t * p1 + t * t * p2;

export const generateFlyTarget = (
  startX: number,
  startY: number,
  screenHeight?: number,
): { x: number; y: number } => {
  const edge = Math.floor(Math.random() * 4);
  const height =
    screenHeight ?? (typeof window !== "undefined" ? window.innerHeight : 800);

  switch (edge) {
    case 0:
      return {
        x:
          startX +
          (Math.random() - 0.5) * FAIRY_VISUAL_CONSTANTS.EDGE_VARIATION_X,
        y: -FAIRY_VISUAL_CONSTANTS.OFF_SCREEN_DISTANCE,
      };
    case 1:
      return {
        x: FAIRY_VISUAL_CONSTANTS.SCREEN_RIGHT_EDGE,
        y:
          startY +
          (Math.random() - 0.5) * FAIRY_VISUAL_CONSTANTS.EDGE_VARIATION_Y,
      };
    case 2:
      return {
        x:
          startX +
          (Math.random() - 0.5) * FAIRY_VISUAL_CONSTANTS.EDGE_VARIATION_X,
        y: height + FAIRY_VISUAL_CONSTANTS.OFF_SCREEN_DISTANCE,
      };
    default:
      return {
        x: FAIRY_VISUAL_CONSTANTS.SCREEN_LEFT_EDGE,
        y:
          startY +
          (Math.random() - 0.5) * FAIRY_VISUAL_CONSTANTS.EDGE_VARIATION_Y,
      };
  }
};

export const generateBezierControl = (
  startX: number,
  startY: number,
  endX: number,
  endY: number,
): { x: number; y: number } => ({
  x: startX + (endX - startX) * 0.5 + (Math.random() - 0.5) * 20,
  y: Math.min(startY, endY) - 50 - Math.random() * 50,
});
