/**
 * Shared types for the fairy transformation animation hook.
 */

import type { OrbitSparkle, TrailSparkle } from "./types";

export type FairyPhase = "morphing" | "flying" | "trail-fading";

export interface FairyAnimationState {
  age: number;
  phase: FairyPhase;
  fairyPos: { x: number; y: number };
  orbitingSparkles: OrbitSparkle[];
  trailSparkles: TrailSparkle[];
  colorPalette: readonly string[];
  morphProgress: number;
  fairyOpacity: number;
  wormOpacity: number;
  fairyFadeIn: number;
  morphScale: number;
  glowIntensity: number;
  isVisible: boolean;
}
