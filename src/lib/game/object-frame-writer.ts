/**
 * Direct DOM frame writer for falling objects.
 *
 * `FallingObject` registers its node once on mount; the animation loop then
 * writes each transform straight to the element. This is the write side of the
 * frame-budget fix: positions change 60 times a second, and pushing them
 * through React meant the reconciler visited all 31 emoji nodes every frame.
 *
 * A module-level registry is deliberate. Passing a callback down through
 * PlayerArea would change the memo contract of a component that currently never
 * needs to re-render for movement.
 */

export interface FrameObject {
  id: string;
}

export interface FramePosition {
  x: number;
  y: number;
}

const nodes = new Map<string, HTMLElement>();
const lastX = new Map<string, number>();

/**
 * Register or unregister an object's DOM node.
 *
 * Pass `null` on unmount. `FallingObject` calls this from a ref callback, so it
 * also runs with `null` before React detaches a changed node.
 */
export const registerObjectNode = (
  id: string,
  node: HTMLElement | null,
): void => {
  if (node) {
    nodes.set(id, node);
  } else {
    nodes.delete(id);
    lastX.delete(id);
  }
};

export interface FrameWriteStats {
  /** Nodes whose transform was written this frame. */
  transformed: number;
  /** Nodes whose `left` had to be written. Should be ~0 in steady state. */
  repositioned: number;
}

/**
 * Write every registered object's position to the DOM.
 *
 * `transform` is compositor-only and is written every frame. `left` is a
 * LAYOUT property: assigning it invalidates layout even when the value is
 * unchanged, so it is written only when x actually moves (a spawn or a lane
 * separation). Writing both every frame was measurably worse than the React
 * version it replaced — -3.6 fps against a pristine baseline on a second port.
 */
export const writeObjectFrames = (
  objects: readonly FrameObject[],
  positions: ReadonlyMap<string, FramePosition>,
): FrameWriteStats => {
  let transformed = 0;
  let repositioned = 0;

  for (const object of objects) {
    const node = nodes.get(object.id);
    if (!node) {
      continue;
    }
    const position = positions.get(object.id);
    if (!position) {
      continue;
    }

    if (lastX.get(object.id) !== position.x) {
      node.style.left = `${position.x}%`;
      lastX.set(object.id, position.x);
      repositioned += 1;
    }

    node.style.transform = `translate3d(-50%, ${position.y}px, 0)`;
    transformed += 1;
  }

  return { transformed, repositioned };
};

/** Test hook: drop every registration so specs do not leak across cases. */
export const resetObjectNodes = (): void => {
  nodes.clear();
  lastX.clear();
};
