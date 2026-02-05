/**
 * Types for display adjustment calculations and state.
 * Shared by scaling helpers and the hook implementation.
 */
export interface DisplaySettings {
  scale: number;
  fontSize: number;
  objectSize: number;
  turtleSize: number;
  spacing: number;
  fallSpeed: number;
  isLandscape: boolean;
  screenWidth: number;
  screenHeight: number;
  aspectRatio: number;
}

export interface DisplayViewport {
  width: number;
  height: number;
  aspectRatio: number;
  isLandscape: boolean;
}

export interface DisplayScaleValues {
  scale: number;
  fontSize: number;
  objectSize: number;
  turtleSize: number;
  spacing: number;
  fallSpeed: number;
}
