/**
 * Fairy transformation animation constants and helpers.
 */

export {
  generateBezierControl,
  generateFlyTarget,
  quadraticBezier,
} from "./fairy-animation-geometry";
export { FAIRY_VISUAL_CONSTANTS } from "./fairy-animation-visuals";

export const FAIRY_ANIMATION_TIMING = {
  MORPH_DURATION: 2000,
  FLY_DURATION: 1500,
  TRAIL_FADE_DURATION: 3500,
  TOTAL_DURATION: 7000,
  UPDATE_INTERVAL: 16,
} as const;

export const FAIRY_GOLD_COLORS = [
  "#FFD700",
  "#FFA500",
  "#FFE4B5",
  "#FFEC8B",
  "#F0E68C",
] as const;

export const FAIRY_INTENSE_COLOR_PALETTES = [
  ["#FF00FF", "#00FFFF", "#FFFF00", "#FF0080", "#00FF80"],
  ["#FF0000", "#FF4500", "#FF8C00", "#FFD700", "#FFFF00"],
  ["#0080FF", "#00BFFF", "#00FFFF", "#40E0D0", "#7FFFD4"],
  ["#8B00FF", "#9370DB", "#BA55D3", "#DA70D6", "#FF00FF"],
  ["#FF1493", "#FF69B4", "#FFA500", "#FFD700", "#FF6347"],
  ["#00FF00", "#32CD32", "#7FFF00", "#ADFF2F", "#00FA9A"],
  ["#0000FF", "#1E90FF", "#00BFFF", "#87CEEB", "#87CEFA"],
  ["#FF0000", "#FF4500", "#FF6347", "#FF7F50", "#FFA500"],
] as const;

export const getRandomIntenseColorPalette = (): readonly string[] => {
  const index = Math.floor(Math.random() * FAIRY_INTENSE_COLOR_PALETTES.length);
  return FAIRY_INTENSE_COLOR_PALETTES[index];
};

export const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

export const calculateMorphScale = (progress: number): number =>
  0.5 + progress * 0.7 + Math.sin(progress * Math.PI * 4) * 0.1;

export const calculateGlowIntensity = (age: number): number =>
  10 + Math.sin(age / 100) * 5;

export const calculateWormOpacity = (progress: number): number =>
  Math.max(0, 1 - progress * 2);

export const calculateFairyFadeIn = (progress: number): number =>
  Math.min(1, progress * 2 - 0.5);
