import { describe, expect, it } from "vitest";

import {
  formatBestTargetTotal,
  normalizeBestTargetTotal,
} from "../high-score-formatters";

describe("high-score-formatters", () => {
  it("normalizes malformed or non-integer best totals before formatting", () => {
    expect(normalizeBestTargetTotal(Number.NaN)).toBe(0);
    expect(normalizeBestTargetTotal(Number.POSITIVE_INFINITY)).toBe(0);
    expect(normalizeBestTargetTotal(-8)).toBe(0);
    expect(normalizeBestTargetTotal(19.9)).toBe(19);
  });

  it("formats best totals using the active menu locale", () => {
    expect(formatBestTargetTotal(1234567.9, "fr")).toBe(
      new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(1234567),
    );
    expect(formatBestTargetTotal(1234567.9, "en")).toBe(
      new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 }).format(1234567),
    );
  });
});
