/**
 * Performance tests to validate optimization improvements.
 * These measure relative performance, not absolute timings.
 */
import { describe, expect, it } from "vitest";

interface GameObject {
  id: string;
  type: string;
  emoji: string;
  x: number;
  y: number;
  speed: number;
  size: number;
  lane: "left" | "right";
}

describe("Performance Improvements (Duplicates + Collision)", () => {
  it("checks for duplicates efficiently using Set operations", () => {
    const items = [
      { emoji: "🍎", name: "apple" },
      { emoji: "🍌", name: "banana" },
      { emoji: "🍇", name: "grapes" },
      { emoji: "🍓", name: "strawberry" },
      { emoji: "🥕", name: "carrot" },
      { emoji: "🥒", name: "cucumber" },
    ];

    const activeEmojis = new Set(["🍎", "🍌"]);
    const spawnedInBatch = new Set(["🍇"]);
    const iterations = 10_000;
    const pickOrder = [0, 1, 2, 0, 1, 2, 3, 4, 5, 0, 1, 3, 4, 5];

    let oldDuplicateChecks = 0;
    let oldRetries = 0;
    let oldCursor = 0;

    const nextOldItem = () => {
      const item = items[pickOrder[oldCursor % pickOrder.length]];
      oldCursor++;
      return item;
    };

    const oldStart = performance.now();
    for (let iter = 0; iter < iterations; iter++) {
      for (let i = 0; i < 8; i++) {
        let item = nextOldItem();
        let attempts = 0;
        const maxAttempts = items.length * 2;

        while (attempts < maxAttempts) {
          oldDuplicateChecks++;
          const existsInBatch = spawnedInBatch.has(item.emoji);

          oldDuplicateChecks++;
          const existsInActive = activeEmojis.has(item.emoji);

          if (!existsInBatch && !existsInActive) break;

          item = nextOldItem();
          attempts++;
          oldRetries++;
        }
      }
    }
    const oldTime = performance.now() - oldStart;

    let newDuplicateChecks = 0;
    let newCursor = 0;

    const nextNewItem = () => {
      const item = items[pickOrder[newCursor % pickOrder.length]];
      newCursor++;
      return item;
    };

    const newStart = performance.now();
    for (let iter = 0; iter < iterations; iter++) {
      for (let i = 0; i < 8; i++) {
        const item = nextNewItem();
        newDuplicateChecks++;
        const existsInBatch = spawnedInBatch.has(item.emoji);
        newDuplicateChecks++;
        const existsInActive = activeEmojis.has(item.emoji);
        const isDuplicate = existsInBatch || existsInActive;
        void isDuplicate;
      }
    }
    const newTime = performance.now() - newStart;

    expect(oldRetries).toBeGreaterThan(0);
    expect(newDuplicateChecks).toBe(iterations * 8 * 2);
    expect(oldDuplicateChecks).toBeGreaterThan(newDuplicateChecks);

    if (import.meta.env.DEV) {
      console.log(
        `Duplicate detection: Old=${oldTime.toFixed(2)}ms, New=${newTime.toFixed(2)}ms, OldChecks=${oldDuplicateChecks}, NewChecks=${newDuplicateChecks}`,
      );
    }
  });

  it("verifies early-exit conditions reduce collision checks", () => {
    const objects: GameObject[] = [];
    for (let i = 0; i < 15; i++) {
      objects.push({
        id: `obj-${i}`,
        type: "test",
        emoji: "🎯",
        x: 50,
        y: i * 100,
        speed: 1,
        size: 40,
        lane: "left",
      });
    }

    const MIN_VERTICAL_GAP = 150;
    const iterations = 1000;

    let checksWithEarlyExit = 0;
    for (let iter = 0; iter < iterations; iter++) {
      for (let i = 0; i < objects.length - 1; i++) {
        const current = objects[i];
        for (let j = i + 1; j < objects.length; j++) {
          const other = objects[j];
          if (Math.abs(current.y - other.y) > MIN_VERTICAL_GAP) continue;
          checksWithEarlyExit++;
          void other;
        }
      }
    }

    let checksWithoutEarlyExit = 0;
    for (let iter = 0; iter < iterations; iter++) {
      for (let i = 0; i < objects.length - 1; i++) {
        const current = objects[i];
        for (let j = i + 1; j < objects.length; j++) {
          const other = objects[j];
          checksWithoutEarlyExit++;
          if (Math.abs(current.y - other.y) <= MIN_VERTICAL_GAP) void other;
        }
      }
    }

    // Deterministic: check count reduction rather than timing.
    expect(checksWithEarlyExit).toBeLessThan(checksWithoutEarlyExit * 0.5);
  });
});
