/**
 * Deterministic z-order matrix for gameplay and HUD layers.
 * Keep this as the single source of truth for scene visual priority.
 */

export const UI_LAYER_MATRIX = {
  GAMEPLAY_BACKGROUND: 10,
  GAMEPLAY_OBJECTS: 20,
  GAMEPLAY_HAZARDS: 30,
  GAMEPLAY_EFFECTS: 40,
  GAMEPLAY_OVERLAY: 60,
  HUD_PRIMARY: 80,
  HUD_SECONDARY: 90,
  HUD_CRITICAL: 110,
  CELEBRATION_OVERLAY: 120,
  MENU_OVERLAY: 130,
  STARTUP_LOADING_OVERLAY: 140,
  WELCOME_OVERLAY: 150,
  DEBUG_OVERLAY: 160,
} as const;

export type UiLayerName = keyof typeof UI_LAYER_MATRIX;
