/**
 * DOM-facing helpers for display adjustment CSS variables.
 * Centralizes CSS update thresholds and performance logging.
 */
import type { DisplayScaleValues } from "./display-adjustment-types";

let cssUpdateCount = 0;
let lastReportTime = Date.now();
const CSS_UPDATE_LOG_THRESHOLD = 100;

export const getCSSUpdateStats = () => ({
  count: cssUpdateCount,
  timeSinceLastReport: Date.now() - lastReportTime,
});

export const initializeDisplayCSSVars = () => {
  const root = document.documentElement;
  root.style.setProperty("--font-scale", "1");
  root.style.setProperty("--object-scale", "1");
  root.style.setProperty("--turtle-scale", "1");
  root.style.setProperty("--spacing-scale", "1");
  root.style.setProperty("--fall-speed-scale", "1");
  root.style.setProperty("--size-scale", "1");
};

const updateCSSVariable = (name: string, value: number) => {
  const computed = getComputedStyle(document.documentElement).getPropertyValue(
    name,
  );
  const current = parseFloat(computed) || 0;
  if (Math.abs(value - current) > 0.01) {
    document.documentElement.style.setProperty(name, value.toFixed(2));

    cssUpdateCount++;
    if (cssUpdateCount % CSS_UPDATE_LOG_THRESHOLD === 0) {
      const elapsed = Date.now() - lastReportTime;
      console.log(
        `[Performance] CSS updates: ${cssUpdateCount} over ${elapsed}ms ` +
          `(${(cssUpdateCount / (elapsed / 1000)).toFixed(2)} updates/sec)`,
      );
      lastReportTime = Date.now();
    }
  }
};

const updateCSSPixelVariable = (name: string, px: number) => {
  const computed = getComputedStyle(document.documentElement).getPropertyValue(
    name,
  );
  const current = parseFloat(computed) || 0;
  if (Math.abs(px - current) > 1) {
    document.documentElement.style.setProperty(name, `${Math.round(px)}px`);
  }
};

export const applyDisplayCSSVariables = (values: DisplayScaleValues) => {
  updateCSSVariable("--font-scale", values.fontSize);
  updateCSSVariable("--object-scale", values.objectSize);
  updateCSSVariable("--turtle-scale", values.turtleSize);
  updateCSSVariable("--spacing-scale", values.spacing);
  updateCSSVariable("--fall-speed-scale", values.fallSpeed);
  updateCSSVariable("--size-scale", values.spacing);
};

export const applyAppHeightVariable = (height: number) => {
  updateCSSPixelVariable("--app-height", height);
};
