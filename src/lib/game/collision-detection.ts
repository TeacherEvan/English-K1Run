/**
 * Collision detection module index.
 *
 * Re-exports focused helpers to keep gameplay utilities organized.
 */

export {
  partitionByLane,
  processLaneCollisions,
} from "./collision-detection-lanes";
export { applyWormObjectCollision } from "./collision-detection-worm";
