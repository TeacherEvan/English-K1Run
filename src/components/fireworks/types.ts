/**
 * Firework particle used in the win celebration.
 */
export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
}

/**
 * Firework burst metadata.
 */
export interface Firework {
  id: string;
  x: number;
  y: number;
  color: string;
  particles: Particle[];
}

/**
 * Confetti element metadata.
 */
export interface ConfettiElement {
  id: number;
  left: number;
  animationDuration: number;
  animationDelay: number;
  color: string;
  rotation: number;
}
