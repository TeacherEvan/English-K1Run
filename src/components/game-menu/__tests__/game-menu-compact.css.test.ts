import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { getGameMenuCompactLayout } from "../menu-layout-mode";

describe("game-menu compact stylesheet", () => {
  it("maps widths into the expected compact layout modes", () => {
    expect(getGameMenuCompactLayout(375)).toBe("single-column");
    expect(getGameMenuCompactLayout(960)).toBe("balanced");
    expect(getGameMenuCompactLayout(1440)).toBe("split");
  });

  it("keeps detected small screens in a single-column compact layout", () => {
    const stylesheet = readFileSync(
      resolve(import.meta.dirname, "../game-menu-compact.css"),
      "utf8",
    );

    expect(stylesheet).toContain('[data-compact-layout="single-column"].menu-home-layout');
    expect(stylesheet).toContain('[data-compact-layout="single-column"].menu-home-actions');
  });

  it("includes a balanced tablet layout for medium-width classrooms", () => {
    const stylesheet = readFileSync(
      resolve(import.meta.dirname, "../game-menu-adaptive.css"),
      "utf8",
    );

    expect(stylesheet).toContain('[data-compact-layout="balanced"].menu-home-layout');
    expect(stylesheet).toContain('[data-compact-layout="balanced"].menu-home-actions');
  });

  it("keeps mobile-safe dialog positioning scoped to menu dialogs", () => {
    const stylesheet = readFileSync(
      resolve(import.meta.dirname, "../game-menu-adaptive.css"),
      "utf8",
    );

    expect(stylesheet).toContain(".menu-dialog-shell");
    expect(stylesheet).toContain("inset: 1rem 1rem auto !important;");
    expect(stylesheet).toContain("transform: none !important;");
  });

  it("keeps the best score card flush with its summary column on super-ultrawide screens", () => {
    const stylesheet = readFileSync(
      resolve(import.meta.dirname, "../game-menu-ultrawide.css"),
      "utf8",
    );

    expect(stylesheet).toContain("@media (min-width: 140rem) and (min-height: 70rem)");
    expect(stylesheet).toContain(".menu-best-time-card {");
    expect(stylesheet).toContain("margin-left: 0;");
  });
});