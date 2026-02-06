/**
 * Type definitions for WormLoadingScreen component
 */

export interface Worm {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  alive: boolean;
  angle: number;
  wigglePhase: number;
}

export interface Splat {
  id: number;
  x: number;
  y: number;
  createdAt: number;
}

export interface WormLoadingScreenProps {
  onComplete: () => void;
  autoCompleteAfterMs?: number;
}
