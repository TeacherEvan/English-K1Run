import { beforeEach, describe, expect, it } from "vitest";

import {
  registerObjectNode,
  resetObjectNodes,
  writeObjectFrames,
} from "../object-frame-writer";

/**
 * The write side of the frame budget.
 *
 * `FallingObject` registers its DOM node once on mount. Every frame the loop
 * writes the transform directly instead of handing React a new object and
 * letting the reconciler rewrite the `style` attribute.
 */

const node = (): HTMLElement => document.createElement("div");

beforeEach(() => {
  resetObjectNodes();
  document.body.innerHTML = "";
});

describe("writeObjectFrames", () => {
  it("writes a translate3d transform for each registered node", () => {
    const a = node();
    const b = node();
    registerObjectNode("a", a);
    registerObjectNode("b", b);

    const stats = writeObjectFrames(
      [{ id: "a" }, { id: "b" }],
      new Map([
        ["a", { x: 10, y: 100 }],
        ["b", { x: 20, y: 250 }],
      ]),
    );

    expect(stats.transformed).toBe(2);
    expect(a.style.transform).toBe("translate3d(-50%, 100px, 0)");
    expect(b.style.transform).toBe("translate3d(-50%, 250px, 0)");
  });

  it("writes x as a percentage so it survives a viewport resize", () => {
    const a = node();
    registerObjectNode("a", a);

    writeObjectFrames([{ id: "a" }], new Map([["a", { x: 37.5, y: 10 }]]));

    expect(a.style.left).toBe("37.5%");
  });

  it("stops rewriting left once x is stable", () => {
    const a = node();
    registerObjectNode("a", a);
    writeObjectFrames([{ id: "a" }], new Map([["a", { x: 50, y: 10 }]]));

    // The object keeps falling but never moves sideways.
    const stats = writeObjectFrames(
      [{ id: "a" }],
      new Map([["a", { x: 50, y: 90 }]]),
    );

    // `left` is a layout property: re-assigning it invalidates layout even when
    // the value is identical. Only the compositor-only transform may be written
    // in steady state.
    expect(stats.repositioned).toBe(0);
    expect(stats.transformed).toBe(1);
    expect(a.style.transform).toBe("translate3d(-50%, 90px, 0)");
  });

  it("rewrites left when a lane separation moves the object sideways", () => {
    const a = node();
    registerObjectNode("a", a);
    writeObjectFrames([{ id: "a" }], new Map([["a", { x: 50, y: 10 }]]));

    const stats = writeObjectFrames(
      [{ id: "a" }],
      new Map([["a", { x: 44, y: 20 }]]),
    );

    expect(stats.repositioned).toBe(1);
    expect(a.style.left).toBe("44%");
  });

  it("skips objects with no registered node", () => {
    registerObjectNode("a", node());

    const stats = writeObjectFrames(
      [{ id: "a" }, { id: "unmounted" }],
      new Map([
        ["a", { x: 0, y: 1 }],
        ["unmounted", { x: 0, y: 2 }],
      ]),
    );

    expect(stats.transformed).toBe(1);
  });

  it("skips nodes whose position entry is missing", () => {
    registerObjectNode("a", node());

    const stats = writeObjectFrames([{ id: "a" }], new Map());

    expect(stats.transformed).toBe(0);
  });

  it("stops writing to a node once it unregisters", () => {
    const a = node();
    registerObjectNode("a", a);
    writeObjectFrames([{ id: "a" }], new Map([["a", { x: 0, y: 50 }]]));
    const before = a.style.transform;

    registerObjectNode("a", null);
    const stats = writeObjectFrames([{ id: "a" }], new Map([["a", { x: 0, y: 99 }]]));

    expect(a.style.transform).toBe(before);
    expect(stats.transformed).toBe(0);
  });
});
