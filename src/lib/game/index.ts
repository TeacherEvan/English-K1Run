/**
 * Game Module Index
 *
 * Re-exports all game logic modules for convenient importing.
 * These modules are split from the monolithic use-game-logic.ts hook.
 *
 * @module game
 */

// Collision detection
export {
  applyWormObjectCollision,
  partitionByLane,
  processLaneCollisions,
} from "./collision-detection";

// Worm management
export {
  countAliveWorms,
  createWorms,
  killWorm,
  removeDeadWorms,
  updateWormPosition,
  updateWorms,
} from "./worm-manager";
