/**
 * Viewport and scaling calculations for `useDisplayAdjustment`.
 * Keeps math and breakpoint logic separate from DOM updates.
 */
import type { ResolutionScale } from "@/context/settings-context";
import type {
  DisplayScaleValues,
  DisplayViewport,
} from "./display-adjustment-types";

const BASE_WIDTH = 1920;
const BASE_HEIGHT = 1080;

const roundToHundredth = (value: number) => Math.round(value * 100) / 100;

export const getViewportMetrics = (): DisplayViewport => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const visual = (window as any).visualViewport;
  const width = visual?.width ?? window.innerWidth;
  const height = visual?.height ?? window.innerHeight;

  return {
    width,
    height,
    aspectRatio: width / height,
    isLandscape: width > height,
  };
};

const getScaleOverride = (resolutionScale: ResolutionScale) => {
  if (resolutionScale === "small") return 0.85;
  if (resolutionScale === "large") return 1.15;
  return 1;
};

export const calculateScaleValues = (
  viewport: DisplayViewport,
  resolutionScale: ResolutionScale,
): DisplayScaleValues => {
  const widthScale = roundToHundredth(viewport.width / BASE_WIDTH);
  const heightScale = roundToHundredth(viewport.height / BASE_HEIGHT);
  const baseScale = Math.min(widthScale, heightScale);
  const scale = roundToHundredth(baseScale * getScaleOverride(resolutionScale));

  let fontSize = scale;
  let objectSize = scale;
  let turtleSize = scale;
  let spacing = scale;
  let fallSpeed = 1;

  if (viewport.width < 768) {
    fontSize = Math.max(scale * 1.0, 0.7);
    objectSize = Math.max(scale * 1.0, 0.7);
    turtleSize = Math.max(scale * 0.9, 0.65);
    spacing = Math.max(scale * 1.0, 0.8);
    fallSpeed = 0.7;
  } else {
    fontSize = Math.max(scale * 0.9, 0.8);
    objectSize = Math.max(scale * 0.9, 0.85);
    turtleSize = Math.max(scale * 0.9, 0.8);
    spacing = Math.max(scale * 0.95, 0.85);
    fallSpeed = viewport.width < 1200 ? 0.85 : 1.0;
  }

  if (viewport.aspectRatio > 2.5) {
    spacing *= 1.1;
    objectSize *= 0.85;
  } else if (viewport.aspectRatio < 0.6) {
    fontSize *= 1.0;
    objectSize *= 1.0;
    spacing *= 0.9;
  }

  if (!viewport.isLandscape && viewport.width < 768) {
    objectSize *= 1.0;
    turtleSize *= 1.0;
    fallSpeed *= 0.8;
  }

  return {
    scale,
    fontSize,
    objectSize,
    turtleSize,
    spacing,
    fallSpeed,
  };
};
