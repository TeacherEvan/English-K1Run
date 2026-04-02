import { describe, expect, it } from "vitest";

import { GAME_CATEGORIES } from "../game-categories";
import { getTargetDisplayLabel, THAI_TARGET_LABELS } from "../target-labels";
import { FRENCH_TARGET_LABELS } from "../target-labels-fr";
import { JAPANESE_TARGET_LABELS } from "../target-labels-ja";
import { MANDARIN_TARGET_LABELS } from "../target-labels-zh-cn";
import { CANTONESE_TARGET_LABELS } from "../target-labels-zh-hk";

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

  it("returns localized gameplay labels for French, Japanese, Mandarin, and Cantonese", () => {
    expect(getTargetDisplayLabel("carrot", "fr")).toBe("carotte");
    expect(getTargetDisplayLabel("orange", "ja", "Shapes & Colors")).toBe(
      "オレンジいろ",
    );
    expect(getTargetDisplayLabel("orange", "zh-CN")).toBe("橙子");
    expect(getTargetDisplayLabel("cat", "zh-HK")).toBe("貓");
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

  it("covers every non-letter gameplay target for French, Japanese, Mandarin, and Cantonese", () => {
    const targetNames = [
      ...new Set(
        GAME_CATEGORIES.flatMap((category) =>
          category.items
            .map((item) => item.name.toLowerCase().trim())
            .filter((name) => name.length > 1),
        ),
      ),
    ];

    const languages = {
      fr: FRENCH_TARGET_LABELS,
      ja: JAPANESE_TARGET_LABELS,
      "zh-CN": MANDARIN_TARGET_LABELS,
      "zh-HK": CANTONESE_TARGET_LABELS,
    };

    for (const [language, labels] of Object.entries(languages)) {
      const missing = targetNames.filter((name) => !(name in labels));
      expect(missing, `${language} missing: ${missing.join(", ")}`).toEqual([]);
    }
  });
});
