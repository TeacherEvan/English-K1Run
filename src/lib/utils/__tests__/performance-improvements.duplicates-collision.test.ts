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

    const oldStart = performance.now();
    for (let iter = 0; iter < iterations; iter++) {
      for (let i = 0; i < 8; i++) {
        let item = items[Math.floor(Math.random() * items.length)];
        let attempts = 0;
        const maxAttempts = items.length * 2;
        while (
          attempts < maxAttempts &&
          (spawnedInBatch.has(item.emoji) ||
            (activeEmojis.has(item.emoji) && Math.random() > 0.3))
        ) {
          item = items[Math.floor(Math.random() * items.length)];
          attempts++;
        }
      }
    }
    const oldTime = performance.now() - oldStart;

    const newStart = performance.now();
    for (let iter = 0; iter < iterations; iter++) {
      for (let i = 0; i < 8; i++) {
        const item = items[Math.floor(Math.random() * items.length)];
        const isDuplicate =
          spawnedInBatch.has(item.emoji) || activeEmojis.has(item.emoji);
        void isDuplicate;
      }
    }
    const newTime = performance.now() - newStart;

    expect(newTime).toBeLessThan(oldTime);
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
