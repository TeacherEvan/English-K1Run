import { describe, expect, it } from "vitest";
import { getTargetSentence } from "../target-announcements";

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
});
