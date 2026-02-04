import { createSpawnObject } from "./spawn-objects-batch";
import { createSpawnImmediateTargets } from "./spawn-objects-immediate";
export type { SpawnDependencies } from "./spawn-objects-types";

/**
 * Object Spawn Helpers
 */
export const createSpawnHandlers = (dependencies: SpawnDependencies) => {
  const spawnImmediateTargets = createSpawnImmediateTargets(dependencies);
  const spawnObject = createSpawnObject(dependencies);
  return { spawnImmediateTargets, spawnObject };
};
