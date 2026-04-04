import { describe, expect, it } from "vitest";

import { createContinuousModeLevelQueue } from "../create-continuous-mode-level-queue";

describe("createContinuousModeLevelQueue", () => {
  it("returns a selected-level-first full pass without duplicates", () => {
    const queue = createContinuousModeLevelQueue(2, 5);

    expect(queue).toEqual([2, 3, 4, 0, 1]);
    expect(new Set(queue).size).toBe(5);
  });

  it("returns an empty queue when there are no levels", () => {
    expect(createContinuousModeLevelQueue(0, 0)).toEqual([]);
  });
});
