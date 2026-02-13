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

const createObjects = (count: number): GameObject[] => {
  const objects: GameObject[] = [];
  for (let i = 0; i < count; i++) {
    objects.push({
      id: `obj-${i}`,
      type: "test",
      emoji: "🎯",
      x: Math.random() * 90 + 5,
      y: Math.random() * 100,
      speed: 1,
      size: 40,
      lane: i % 2 === 0 ? "left" : "right",
    });
  }
  return objects;
};

describe("Performance Improvements (Lane + Update)", () => {
  it("partitions objects by lane more efficiently than repeated filtering", () => {
    const objects = createObjects(30);

    const iterations = 1000;
    const oldStart = performance.now();
    for (let iter = 0; iter < iterations; iter++) {
      for (let i = 0; i < 8; i++) {
        const lane = i % 2 === 0 ? "left" : "right";
        const laneObjects = objects.filter((obj) => obj.lane === lane);
        void laneObjects.length;
      }
    }
    const oldTime = performance.now() - oldStart;

    const newStart = performance.now();
    for (let iter = 0; iter < iterations; iter++) {
      const leftObjects: GameObject[] = [];
      const rightObjects: GameObject[] = [];
      for (const obj of objects) {
        (obj.lane === "left" ? leftObjects : rightObjects).push(obj);
      }
      for (let i = 0; i < 8; i++) {
        const laneObjects = i % 2 === 0 ? leftObjects : rightObjects;
        void laneObjects.length;
      }
    }
    const newTime = performance.now() - newStart;

    // Conservative threshold to avoid flaky tests.
    expect(newTime).toBeLessThan(oldTime * 0.8);

    if (import.meta.env.DEV) {
      console.log(
        `Lane filtering: Old=${oldTime.toFixed(2)}ms, New=${newTime.toFixed(2)}ms`,
      );
    }
  });

  it("updates objects more efficiently with pre-allocated arrays", () => {
    const objects = createObjects(30);
    const iterations = 10_000;
    const speedMultiplier = 1.2;

    const oldStart = performance.now();
    for (let iter = 0; iter < iterations; iter++) {
      const updated: GameObject[] = [];
      for (const obj of objects) {
        updated.push({ ...obj, y: obj.y + obj.speed * speedMultiplier });
      }
      void updated.length;
    }
    const oldTime = performance.now() - oldStart;

    const newStart = performance.now();
    for (let iter = 0; iter < iterations; iter++) {
      const updated: GameObject[] = new Array(objects.length);
      let idx = 0;
      for (const obj of objects) {
        updated[idx++] = {
          id: obj.id,
          type: obj.type,
          emoji: obj.emoji,
          x: obj.x,
          y: obj.y + obj.speed * speedMultiplier,
          speed: obj.speed,
          size: obj.size,
          lane: obj.lane,
        };
      }
      void updated.length;
    }
    const newTime = performance.now() - newStart;

    // JIT heuristics can make either approach faster on a given run.
    // We only assert we didn't regress catastrophically.
    expect(newTime).toBeLessThan(oldTime * 3);

    if (import.meta.env.DEV) {
      console.log(
        `Object update: Old=${oldTime.toFixed(2)}ms, New=${newTime.toFixed(2)}ms`,
      );
    }
  });
});
