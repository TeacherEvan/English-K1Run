import type { FairyTransformObject } from "../../hooks/use-game-logic";

/**
 * Props for the fairy transformation animation.
 */
export interface FairyTransformationProps {
  fairy: FairyTransformObject;
}

/**
 * Trail sparkle metadata for the flying phase.
 */
export interface TrailSparkle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
}

/**
 * Orbiting sparkle metadata for morph/fly phases.
 */
export interface OrbitSparkle {
  id: number;
  angle: number;
  distance: number;
  speed: number;
  size: number;
  color: string;
}
