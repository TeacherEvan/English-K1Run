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
  
  /** Total animation duration (pre-calculated for performance) */
  TOTAL_DURATION: 10000, // MORPH_DURATION + FLY_DURATION + TRAIL_FADE_DURATION
  
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
  
  /** Fly target position constants for screen edge generation */
  EDGE_VARIATION_X: 40, // Random X variation when flying to top/bottom edges
  EDGE_VARIATION_Y: 200, // Random Y variation when flying to left/right edges
  OFF_SCREEN_DISTANCE: 100, // Distance beyond screen edge for target position
  SCREEN_RIGHT_EDGE: 110, // X position for right edge (percentage)
  SCREEN_LEFT_EDGE: -20, // X position for left edge (percentage)
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
 * @param screenHeight - Optional screen height override (for testing/SSR)
 * @returns Target position {x: percentage, y: pixels}
 */
export const generateFlyTarget = (
  startX: number, 
  startY: number,
  screenHeight?: number
): { x: number; y: number } => {
  const edge = Math.floor(Math.random() * 4) // 0=top, 1=right, 2=bottom, 3=left
  const height = screenHeight ?? (typeof window !== 'undefined' ? window.innerHeight : 800)
  
  switch (edge) {
    case 0: // top
      return { 
        x: startX + (Math.random() - 0.5) * FAIRY_VISUAL_CONSTANTS.EDGE_VARIATION_X, 
        y: -FAIRY_VISUAL_CONSTANTS.OFF_SCREEN_DISTANCE 
      }
    case 1: // right
      return { 
        x: FAIRY_VISUAL_CONSTANTS.SCREEN_RIGHT_EDGE, 
        y: startY + (Math.random() - 0.5) * FAIRY_VISUAL_CONSTANTS.EDGE_VARIATION_Y 
      }
    case 2: // bottom
      return { 
        x: startX + (Math.random() - 0.5) * FAIRY_VISUAL_CONSTANTS.EDGE_VARIATION_X, 
        y: height + FAIRY_VISUAL_CONSTANTS.OFF_SCREEN_DISTANCE 
      }
    default: // left
      return { 
        x: FAIRY_VISUAL_CONSTANTS.SCREEN_LEFT_EDGE, 
        y: startY + (Math.random() - 0.5) * FAIRY_VISUAL_CONSTANTS.EDGE_VARIATION_Y 
      }
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
