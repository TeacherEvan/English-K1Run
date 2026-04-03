import { describe, expect, it } from "vitest";
import { createDefaultModeLevelQueue } from "../default-mode-level-queue";

describe("createDefaultModeLevelQueue", () => {
  it("keeps the selected level first and includes all levels once", () => {
    const queue = createDefaultModeLevelQueue(2, 5, () => 0.5);

    expect(queue[0]).toBe(2);
    expect(queue).toHaveLength(5);
    expect(new Set(queue).size).toBe(5);
    expect(queue.slice().sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4]);
  });

  it("returns only the selected level when one level exists", () => {
    expect(createDefaultModeLevelQueue(0, 1)).toEqual([0]);
  });

  it("shuffles the remaining levels deterministically with the provided random", () => {
    const queue = createDefaultModeLevelQueue(1, 4, () => 0);

    expect(queue).toEqual([1, 2, 3, 0]);
  });
});
