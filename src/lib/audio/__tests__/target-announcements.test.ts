import { describe, expect, it, vi } from "vitest";
import { speechSynthesizer } from "../speech-synthesizer";
import { getTargetSentence, playTargetSentence } from "../target-announcements";

describe("getTargetSentence", () => {
  it("returns the selected gameplay language sentence template", () => {
    expect(getTargetSentence("strawberry", "en")).toBe(
      "The strawberry is red and juicy.",
    );
    expect(getTargetSentence("strawberry", "th")).toBe(
      "สตรอเบอร์รี่สีแดงและฉ่ำ",
    );
    expect(getTargetSentence("strawberry", "zh-CN")).toBe(
      "草莓是红色的，很多汁。",
    );
  });

  it("falls back to an English helper sentence when no template exists", () => {
    expect(getTargetSentence("rocket ship", "th")).toBe(
      "Find the rocket ship.",
    );
  });
});

describe("playTargetSentence", () => {
  it("plays the selected gameplay language sentence with the matching langCode", async () => {
    const speakAsync = vi
      .spyOn(speechSynthesizer, "speakAsync")
      .mockResolvedValue(true);

    await expect(playTargetSentence("strawberry", "th")).resolves.toBe(
      "สตรอเบอร์รี่สีแดงและฉ่ำ",
    );
    expect(speakAsync).toHaveBeenCalledWith("สตรอเบอร์รี่สีแดงและฉ่ำ", {
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
});
