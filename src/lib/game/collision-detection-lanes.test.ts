import { describe, expect, it } from "vitest";
import { COLLISION_MIN_SEPARATION } from "../constants/game-config";
import type { GameObject } from "../../types/game";
import { processLaneCollisions } from "./collision-detection-lanes";

const createObject = (id: string, x: number, y: number): GameObject => ({
  id,
  type: "apple",
  emoji: "🍎",
  x,
  y,
  speed: 1,
  size: 60,
  lane: "left",
});

describe("processLaneCollisions", () => {
  it("separates objects that share the exact same x position", () => {
    const objects = [createObject("a", 50, 40), createObject("b", 50, 55)];

    processLaneCollisions(objects, "left");

    expect(Math.abs(objects[0].x - objects[1].x)).toBe(
      COLLISION_MIN_SEPARATION,
    );
  });
});