import { describe, expect, it } from "vitest";
import { CLASSROOM_BRAND } from "../classroom-brand";

describe("CLASSROOM_BRAND", () => {
  it("locks the public-facing brand name", () => {
    expect(CLASSROOM_BRAND.name).toBe("English K1 Run");
    expect(CLASSROOM_BRAND.shortName).toBe("English K1 Run");
  });

  it("locks the agreed brand personality", () => {
    expect(CLASSROOM_BRAND.personality).toEqual([
      "warm",
      "encouraging",
      "outdoorsy",
    ]);
    expect(CLASSROOM_BRAND.signature).toBe("Teacher launch • Child play");
  });

  it("defines the approved light-first classroom palette", () => {
    expect(CLASSROOM_BRAND.palette.shell).toContain("oklch");
    expect(CLASSROOM_BRAND.palette.panel).toContain("oklch");
    expect(CLASSROOM_BRAND.palette.sky).toContain("oklch");
    expect(CLASSROOM_BRAND.palette.leaf).toContain("oklch");
    expect(CLASSROOM_BRAND.palette.sun).toContain("oklch");
  });
});
