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
  partitionByLane,
  processLaneCollisions,
} from "./collision-detection";
