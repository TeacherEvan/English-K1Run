import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { getAccessibilityManager } from "../accessibility-manager";

/**
 * Regression guard for the motion-system collapse.
 *
 * accessibility-styles.css used to carry a bare universal rule:
 *
 *   * { animation-duration: calc(var(--animation-speed, 1) * 1s) !important;
 *       transition-duration: calc(var(--animation-speed, 1) * 0.2s) !important; }
 *
 * Because it assigned a literal duration with `!important`, every element in
 * the app computed 1s animations and 0.2s transitions at the DEFAULT speed. The
 * designed timings (25ms press, 90ms tap acknowledge, 140ms hover, 300ms
 * dialog, 720ms staggered entry) all collapsed into one flat speed — measured
 * in the browser before the fix: the start button reported
 * `transitionDuration: 0.2s` instead of its declared 0.3s, and `.duration-300`
 * reported `animationDuration: 1s`.
 *
 * The multiplier now lives behind `html[data-animation-speed]`, which the
 * manager writes only when the user asks for a non-default speed.
 */
describe("animation speed override is opt-in", () => {
  beforeEach(() => {
    document.documentElement.removeAttribute("data-animation-speed");
    localStorage.clear();
  });

  it("leaves the root unmarked at the default speed", () => {
    getAccessibilityManager().setAnimationSpeed(1);

    expect(
      document.documentElement.hasAttribute("data-animation-speed"),
    ).toBe(false);
  });

  it("marks the root when a non-default speed is requested", () => {
    getAccessibilityManager().setAnimationSpeed(2);

    expect(
      document.documentElement.getAttribute("data-animation-speed"),
    ).toBe("2");
  });

  it("clears the marker when the speed returns to the default", () => {
    const manager = getAccessibilityManager();

    manager.setAnimationSpeed(0.5);
    expect(
      document.documentElement.getAttribute("data-animation-speed"),
    ).toBe("0.5");

    manager.setAnimationSpeed(1);
    expect(
      document.documentElement.hasAttribute("data-animation-speed"),
    ).toBe(false);
  });

  it("keeps per-component durations authorable in the stylesheet", () => {
    const css = readFileSync(
      resolve(process.cwd(), "src/lib/accessibility/accessibility-styles.css"),
      "utf8",
    );

    // A bare `* { ... !important }` duration rule is what flattened the motion
    // system. Nothing may reintroduce one.
    expect(css).not.toMatch(/^\s*\*\s*\{[^}]*!important/m);
    expect(css).toContain("html[data-animation-speed]");

    // The reduced-motion contract must survive: it depends on collapsing
    // durations, so it keeps its own !important block.
    expect(css).toContain("html.reduced-motion *");
  });
});
