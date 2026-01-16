# Copilot Instructions — English-K1Run

## Purpose and architecture

- Single-player, touch-first classroom game. Core state lives in `use-game-logic` in [src/hooks/use-game-logic.ts](../src/hooks/use-game-logic.ts); do not create parallel state in components.
- Data flow: UI events ? `use-game-logic` actions (e.g., `handleObjectTap`, `startGame`) ? state updates ? render.
- Audio is modularized under [src/lib/audio/](../src/lib/audio/) and re-exported from [src/lib/audio/index.ts](../src/lib/audio/index.ts). Use singletons; do not instantiate new ones.

## Critical conventions

- Coordinates are percentage-based only. X ranges 5–95% with `LANE_BOUNDS` in [src/lib/constants/game-config.ts](../src/lib/constants/game-config.ts). Never use pixel positions.
- Touch handling must route through `multiTouchHandler` in [src/lib/touch-handler.ts](../src/lib/touch-handler.ts). Do not attach raw `onClick` for gameplay objects.
- Sizing uses CSS vars (`--font-scale`, `--object-scale`, `--spacing-scale`) set by [src/hooks/use-display-adjustment.ts](../src/hooks/use-display-adjustment.ts).

## UI patterns

- Frequently re-rendered components use `memo()` (example: `FallingObject` in [src/components/FallingObject.tsx](../src/components/FallingObject.tsx)).
- Game menu layout must keep header, grid (with `flex-1`), and footer as siblings; avoid IIFE wrappers that break layout in [src/components/GameMenu.tsx](../src/components/GameMenu.tsx).
- Shadcn-style UI primitives and CVA variants live in [src/components/ui/](../src/components/ui/).

## Audio, i18n, and welcome flow

- Audio fallback chain: Web Audio ? HTMLAudio ? Speech Synthesis ? tones. Keys map like emoji_apple.wav ? `"apple"` and `"emoji_apple"` in [src/lib/sound-manager.ts](../src/lib/sound-manager.ts).
- Language config and voices: [src/lib/constants/language-config.ts](../src/lib/constants/language-config.ts). Translations: [src/locales/](../src/locales/).
- Welcome screen narration is four phases and respects reduced motion; e2e mode disables animations when `?e2e=1` is present.

## Gameplay tuning and continuous mode

- Tuning constants live in [src/lib/constants/game-config.ts](../src/lib/constants/game-config.ts).
- Continuous mode state in SettingsContext with persistence (localStorage key `continuousModeHighScore`); see [src/context/settings-context.tsx](../src/context/settings-context.tsx) and [src/components/SettingsDialog.tsx](../src/components/SettingsDialog.tsx).

## Developer workflows

- Dev server: `npm run dev`. Verification: `npm run verify` (lint + typecheck + build). Build uses `--noCheck` due to React 19 types.
- Automated formatting runs via `code_review.ps1` every 5 minutes; do not disable it.
- E2E: use `?e2e=1` to skip the welcome screen. Page objects and fixtures are in [e2e/fixtures/game.fixture.ts](../e2e/fixtures/game.fixture.ts); prefer `gamePage.menu.startGame()` patterns. Tests live in [e2e/specs/](../e2e/specs/).

## Adding content

- New categories go in [src/lib/constants/game-categories.ts](../src/lib/constants/game-categories.ts), with sentence templates in [src/lib/constants/sentence-templates.ts](../src/lib/constants/sentence-templates.ts) and audio generation via scripts in [scripts/](../scripts/).
