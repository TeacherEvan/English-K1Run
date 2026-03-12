import { describe, expect, it } from "vitest";

import { GAME_CATEGORIES } from "../game-categories";
import { getTargetDisplayLabel, THAI_TARGET_LABELS } from "../target-labels";

describe("getTargetDisplayLabel", () => {
  it("returns Thai labels for gameplay targets", () => {
    expect(getTargetDisplayLabel("carrot", "th")).toBe("แครอท");
    expect(getTargetDisplayLabel("orange", "th", "Shapes & Colors")).toBe(
      "สีส้ม",
    );
    expect(getTargetDisplayLabel("orange", "th", "Fruits & Vegetables")).toBe(
      "ส้ม",
    );
  });

  it("covers every live gameplay target with a Thai display label", () => {
    const targetNames = [
      ...new Set(
        GAME_CATEGORIES.flatMap((category) =>
          category.items.map((item) => item.name.toLowerCase().trim()),
        ),
      ),
    ];

    const missing = targetNames.filter((name) => !(name in THAI_TARGET_LABELS));
    expect(missing).toEqual([]);
  });
});
