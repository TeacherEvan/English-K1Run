/**
 * Fairy Transformation Animation Constants
 * 
 * Extracted from FairyTransformation component for better maintainability
 * and to reduce component complexity.
 */

/**
 * Animation timing constants (in milliseconds)
 */
export const FAIRY_ANIMATION_TIMING = {
  /** Duration of the morphing phase (worm → fairy transformation) */
  MORPH_DURATION: 3000,
  
  /** Duration of the flying phase (fairy flying off screen) */
  FLY_DURATION: 2000,
  
  /** Duration of trail sparkles fading out */
  TRAIL_FADE_DURATION: 5000,
  
  /** Total animation duration */
  get TOTAL_DURATION() {
    return this.MORPH_DURATION + this.FLY_DURATION + this.TRAIL_FADE_DURATION
  },
  
  /** Throttle interval for state updates (ms) - ~30fps for smooth animation */
  UPDATE_INTERVAL: 33,
} as const

/**
 * Visual style constants
 */
export const FAIRY_VISUAL_CONSTANTS = {
  /** Size of the fairy emoji in pixels */
  FAIRY_SIZE: 80,
  
  /** Number of sparkles orbiting the fairy during morph/fly phases */
  SPARKLE_COUNT: 12,
  
  /** Maximum number of trail sparkles visible at once */
  MAX_TRAIL_SPARKLES: 30,
  
  /** Spawn new trail sparkles every N frames (~10fps) */
  TRAIL_SPAWN_FRAME_INTERVAL: 6,
} as const

/**
 * Gold color palette for sparkles
 */
export const FAIRY_GOLD_COLORS = [
  '#FFD700', // Gold
  '#FFA500', // Orange
  '#FFE4B5', // Moccasin
  '#FFEC8B', // Light Goldenrod
  '#F0E68C'  // Khaki
] as const

/**
 * Animation easing function - cubic ease-out
 * @param t - Progress value from 0 to 1
 * @returns Eased progress value
 */
export const easeOutCubic = (t: number): number => {
  return 1 - Math.pow(1 - t, 3)
}

/**
 * Calculate quadratic Bezier curve point
 * @param t - Progress along curve (0 to 1)
 * @param p0 - Start point
 * @param p1 - Control point
 * @param p2 - End point
 * @returns Interpolated point on curve
 */
export const quadraticBezier = (
  t: number, 
  p0: number, 
  p1: number, 
  p2: number
): number => {
  return (1 - t) * (1 - t) * p0 + 2 * (1 - t) * t * p1 + t * t * p2
}

/**
 * Generate random fly target position at screen edge
 * @param startX - Starting X position (percentage)
 * @param startY - Starting Y position (pixels)
 * @returns Target position {x: percentage, y: pixels}
 */
export const generateFlyTarget = (
  startX: number, 
  startY: number
): { x: number; y: number } => {
  const edge = Math.floor(Math.random() * 4) // 0=top, 1=right, 2=bottom, 3=left
  const screenHeight = window.innerHeight || 800
  
  switch (edge) {
    case 0: return { x: startX + (Math.random() - 0.5) * 40, y: -100 } // top
    case 1: return { x: 110, y: startY + (Math.random() - 0.5) * 200 } // right
    case 2: return { x: startX + (Math.random() - 0.5) * 40, y: screenHeight + 100 } // bottom
    default: return { x: -20, y: startY + (Math.random() - 0.5) * 200 } // left
  }
}

/**
 * Generate Bezier control point for smooth arc
 * @param startX - Start X position
 * @param startY - Start Y position
 * @param endX - End X position
 * @param endY - End Y position
 * @returns Control point {x, y}
 */
export const generateBezierControl = (
  startX: number,
  startY: number,
  endX: number,
  endY: number
): { x: number; y: number } => {
  return {
    x: startX + (endX - startX) * 0.5 + (Math.random() - 0.5) * 20,
    y: Math.min(startY, endY) - 50 - Math.random() * 50 // Arc upward
  }
}

/**
 * Calculate morph scale animation
 * @param progress - Morph progress (0 to 1)
 * @returns Scale multiplier
 */
export const calculateMorphScale = (progress: number): number => {
  return 0.5 + progress * 0.7 + Math.sin(progress * Math.PI * 4) * 0.1
}

/**
 * Calculate glow intensity with pulsing effect
 * @param age - Animation age in milliseconds
 * @returns Glow intensity value
 */
export const calculateGlowIntensity = (age: number): number => {
  return 10 + Math.sin(age / 100) * 5
}

/**
 * Calculate worm fade-out opacity during morph
 * @param progress - Morph progress (0 to 1)
 * @returns Opacity value (0 to 1)
 */
export const calculateWormOpacity = (progress: number): number => {
  return Math.max(0, 1 - progress * 2) // Fades out in first half
}

/**
 * Calculate fairy fade-in opacity during morph
 * @param progress - Morph progress (0 to 1)
 * @returns Opacity value (0 to 1)
 */
export const calculateFairyFadeIn = (progress: number): number => {
  return Math.min(1, progress * 2 - 0.5) // Fades in second half
}
