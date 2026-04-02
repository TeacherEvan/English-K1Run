import { describe, expect, it, vi } from "vitest";
import { GAME_CATEGORIES } from "../../constants/game-categories";
import { FRENCH_SENTENCE_TEMPLATES } from "../../constants/sentence-templates/fr";
import { JAPANESE_SENTENCE_TEMPLATES } from "../../constants/sentence-templates/ja";
import { THAI_SENTENCE_TEMPLATES } from "../../constants/sentence-templates/th";
import { MANDARIN_SENTENCE_TEMPLATES } from "../../constants/sentence-templates/zh-cn";
import { CANTONESE_SENTENCE_TEMPLATES } from "../../constants/sentence-templates/zh-hk";
import { speechSynthesizer } from "../speech-synthesizer";
import { getTargetSentence, playTargetSentence } from "../target-announcements";

describe("getTargetSentence", () => {
  it("returns the selected gameplay language sentence template", () => {
    expect(getTargetSentence("strawberry", "en")).toBe(
      "The strawberry is red and juicy.",
    );
    expect(getTargetSentence("strawberry", "th")).toBe(
      "สตรอเบอร์รี่ผลนี้สีแดงและฉ่ำ",
    );
    expect(getTargetSentence("strawberry", "zh-CN")).toBe(
      "草莓是红色的，很多汁。",
    );
  });

  it("does not fall back to English for missing non-English templates", () => {
    expect(getTargetSentence("rocket ship", "th")).toBe("");
    expect(getTargetSentence("rocket ship", "fr")).toBe("");
  });

  it("covers every live gameplay target with a Thai sentence template", () => {
    const targetNames = [
      ...new Set(
        GAME_CATEGORIES.flatMap((category) =>
          category.items.map((item) => item.name.toLowerCase().trim()),
        ),
      ),
    ];

    const missing = targetNames.filter(
      (name) => !(name in THAI_SENTENCE_TEMPLATES),
    );
    expect(missing).toEqual([]);
    expect(getTargetSentence("fire truck", "th")).toBe(
      "รถดับเพลิงคันนี้มีเสียงไซเรนดัง",
    );
  });

  it("covers every live gameplay target for French, Japanese, Mandarin, and Cantonese", () => {
    const targetNames = [
      ...new Set(
        GAME_CATEGORIES.flatMap((category) =>
          category.items.map((item) => item.name.toLowerCase().trim()),
        ),
      ),
    ];

    const languages = {
      fr: FRENCH_SENTENCE_TEMPLATES,
      ja: JAPANESE_SENTENCE_TEMPLATES,
      "zh-CN": MANDARIN_SENTENCE_TEMPLATES,
      "zh-HK": CANTONESE_SENTENCE_TEMPLATES,
    };

    for (const [language, templates] of Object.entries(languages)) {
      const missing = targetNames.filter((name) => !(name in templates));
      expect(missing, `${language} missing: ${missing.join(", ")}`).toEqual([]);
    }
  });
});

describe("playTargetSentence", () => {
  it("plays the selected gameplay language sentence with the matching langCode", async () => {
    const speakAsync = vi
      .spyOn(speechSynthesizer, "speakAsync")
      .mockResolvedValue(true);

    await expect(playTargetSentence("strawberry", "th")).resolves.toBe(
      "สตรอเบอร์รี่ผลนี้สีแดงและฉ่ำ",
    );
    expect(speakAsync).toHaveBeenCalledWith("สตรอเบอร์รี่ผลนี้สีแดงและฉ่ำ", {
      langCode: "th",
    });

    await expect(playTargetSentence("strawberry", "zh-CN")).resolves.toBe(
      "草莓是红色的，很多汁。",
    );
    expect(speakAsync).toHaveBeenLastCalledWith("草莓是红色的，很多汁。", {
      langCode: "zh-CN",
    });

    speakAsync.mockRestore();
  });

  it("does not attempt speech when a non-English target sentence is missing", async () => {
    const speakAsync = vi
      .spyOn(speechSynthesizer, "speakAsync")
      .mockResolvedValue(true);

    await expect(playTargetSentence("rocket ship", "fr")).resolves.toBe("");
    expect(speakAsync).not.toHaveBeenCalled();

    speakAsync.mockRestore();
  });
});
