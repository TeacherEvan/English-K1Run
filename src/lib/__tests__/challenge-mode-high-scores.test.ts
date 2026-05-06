import type { SupportedLanguage } from "@/lib/constants/language-config";
import {
  getBestChallengeModeScore,
  parseLegacyBestTargetTotal,
  readChallengeModeHighScores,
  recordChallengeModeHighScore,
} from "../challenge-mode-high-scores";
import { beforeEach, describe, expect, it } from "vitest";

const STORAGE_KEY = "challengeModeHighScores";

const makeEntry = (
  score: number,
  language: SupportedLanguage,
  achievedAt: string,
) => ({ score, language, achievedAt });

describe("challenge mode high scores", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns an empty list when storage is blank", () => {
    expect(readChallengeModeHighScores()).toEqual([]);
    expect(getBestChallengeModeScore()).toBeNull();
  });

  it("records scores sorted by score desc then achievedAt desc", () => {
    recordChallengeModeHighScore(
      makeEntry(8, "en", "2026-04-05T08:00:00.000Z"),
    );
    recordChallengeModeHighScore(
      makeEntry(12, "th", "2026-04-05T09:00:00.000Z"),
    );
    recordChallengeModeHighScore(
      makeEntry(12, "fr", "2026-04-05T10:00:00.000Z"),
    );

    expect(readChallengeModeHighScores()).toEqual([
      makeEntry(12, "fr", "2026-04-05T10:00:00.000Z"),
      makeEntry(12, "th", "2026-04-05T09:00:00.000Z"),
      makeEntry(8, "en", "2026-04-05T08:00:00.000Z"),
    ]);
    expect(getBestChallengeModeScore()).toBe(12);
  });

  it("falls back safely when stored JSON is malformed", () => {
    localStorage.setItem(STORAGE_KEY, "not-json-at-all");

    expect(readChallengeModeHighScores()).toEqual([]);
    expect(getBestChallengeModeScore()).toBeNull();
  });

  it("ignores malformed entries while keeping valid ones", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        makeEntry(7, "ja", "2026-04-05T08:00:00.000Z"),
        { score: "oops", language: "en", achievedAt: "bad" },
        { score: 10, language: "xx", achievedAt: "2026-04-05" },
      ]),
    );

    expect(readChallengeModeHighScores()).toEqual([
      makeEntry(7, "ja", "2026-04-05T08:00:00.000Z"),
    ]);
  });

  it("rejects malformed legacy best-total values", () => {
    expect(parseLegacyBestTargetTotal(null)).toBeNull();
    expect(parseLegacyBestTargetTotal("not-a-number")).toBeNull();
    expect(parseLegacyBestTargetTotal("-4")).toBeNull();
    expect(parseLegacyBestTargetTotal("15.8")).toBe(15);
  });
});
