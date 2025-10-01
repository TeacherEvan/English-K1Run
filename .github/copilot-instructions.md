# Copilot Instructions for Kindergarten Race Game

## Project Overview

Split-screen educational racing game where two players compete by tapping falling objects to advance their turtle characters. Built with React 19 + TypeScript + Vite, optimized for tablets and touch devices in kindergarten classrooms.

## Architecture & Data Flow

**State Ownership**: `src/hooks/use-game-logic.ts` is the single source of truth for all gameplay state`gameObjects[]`, `GameState`, `GAME_CATEGORIES`, player scoring, and winner detection. Never create parallel game state elsewhere.

**Split-Screen Logic**: Objects spawn with `x <= 50` for player 1, `x > 50` for player 2 (percentages). `App.tsx` remaps these to half-width containers in the render pass. Maintain this coordinate system when adding spawn patterns.

**Category System**: `GAME_CATEGORIES` array defines levels with `items: { emoji, name }[]`. Special case: "Alphabet Challenge" has `requiresSequence: true` which enforces sequential tapping (ABC...). When adding categories, check if sequence mode applies.

**Object Lifecycle**: 
1. `spawnObject()` creates up to 15 active objects (tracked by `eventTracker`)
2. `handleObjectTap()` is the **only** place that scores points, plays audio, advances progress, and detects winners
3. Objects auto-remove on y > 100 or manual tap; never mutate `gameObjects` outside the hook

## Build & Developer Workflows

**Development**: `npm run dev` starts Vite on port 5173 with polling HMR (required for Termux/Docker file watching)

**Constrained Devices**: Run `npm run install:android` or `npm run install:safe` before first dev server start to handle ARM64 rollup compatibility

**Production Build**: `npm run build` runs `tsc -b --noCheck && vite build`keep the `--noCheck` flag due to React 19 type instabilities

**Docker**:
- Dev: `docker-compose --profile dev up kindergarten-race-dev` (hot reload, volume-mounted)
- Prod: `docker-compose up -d` (nginx-served static bundles)
- Volume mapping excludes `/app/node_modules` to avoid platform conflicts

## Styling & Responsiveness

**CSS Variables for Scaling**: `use-display-adjustment.ts` calculates responsive values and sets CSS custom props on `<html>`:
- `--font-scale`, `--object-scale`, `--turtle-scale`, `--spacing-scale`, `--fall-speed`
- **Always use these vars** in inline styles instead of hardcoded pixel values
- When adding new vars, expose them in `QuickDebug` for diagnostics

**Tailwind Structure**: Import only `src/main.css` in `main.tsx`. Add global styles by extending `main.css` to preserve Tailwind's layer order.

**Background Rotation**: `App.css` defines 5 `.app-bg-*` classes using real image overlays. `pickRandomBackground()` in `App.tsx` switches every 30sadd new backgrounds by extending both the class list and `BACKGROUND_CLASSES` array.

## Component Patterns

**UI Primitives** (`src/components/ui/*`): Shadcn-style components using `class-variance-authority` (CVA). Example from `button.tsx`:
```tsx
const buttonVariants = cva("base-classes", {
  variants: { size: {...}, variant: {...} }
})
```
Extend existing variants instead of adding inline Tailwind classes.

**Utility Function**: Use `cn()` from `lib/utils.ts` to merge Tailwind classes (wraps `clsx` + `tailwind-merge`).

**Memoization**: Frequently re-rendered components like `PlayerArea`, `FallingObject`, `TargetDisplay`, `GameMenu` wrap with `memo()`. Follow this pattern for new game components that receive props on every frame.

**Debug Overlays**: `FireworksDisplay`, `PerformanceMonitor`, `EventTrackerDebug`, `QuickDebug`, `ErrorMonitor` mount once in `<App />`. They consume global singletons (`eventTracker`, `soundManager`)don't instantiate new trackers.

## Telemetry & Audio

**Event Tracking**: `src/lib/event-tracker.ts` is a singleton that auto-registers global error handlers, FPS tracking, and spawn-rate warnings on import. Use `eventTracker.trackEvent()`, `trackError()`, `trackUserAction()` for logging so overlays render consistently.

**Error Handling**: `ErrorMonitor` monkey-patches `console.error/warn` to display in-game. Keep console usage minimal; wrap debug logs in `if (import.meta.env.DEV)` to avoid UI spam.

**Audio System**: `src/lib/sound-manager.ts` uses Web Audio API, lazy-initialized on first user interaction. Call `playSoundEffect.tap()`, `.success()`, `.wrong()`, `.win()` for feedbackdon't create `<audio>` tags. Legacy `.wav` files in `/sounds/` are indexed by normalized names (e.g., `emoji_apple.wav`  keys: `"apple"`, `"emoji_apple"`).

## Vite Configuration

**Path Alias**: `@` resolves to `src/` (e.g., `import { cn } from '@/lib/utils'`)

**Polling Watch**: `server.watch.usePolling: true` essential for Termux/Docker dev environments where native FS events don't propagate

**Manual Chunking**: `build.rollupOptions.output.manualChunks()` separates vendor code into:
- `vendor-react`, `vendor-radix`, `vendor-ui-utils`, `vendor-large-utils`, `vendor-other`
- `ui-components`, `game-components`, `game-hooks`, `game-utils`

When adding large dependencies, assign them to the appropriate bucket to prevent chunk bloat.

## Project-Specific Conventions

**Props Interfaces**: All components define strict TypeScript interfaces for props (e.g., `PlayerAreaProps`, `FallingObjectProps`). Don't use inline types.

**State Updates**: Use functional setState when new state depends on previous (e.g., `setGameObjects(prev => [...prev, newObj])`).

**Category Content**: Sound files in `/sounds/` follow naming convention: `{name}.wav`, `emoji_{name}.wav`. When adding items to `GAME_CATEGORIES`, ensure corresponding audio assets exist or `sound-manager` fallback to Web Audio tones.

**TypeScript Compilation**: Uses `tsc -b` (project references) but with `--noCheck` flag due to React 19 type evolution. Don't remove the flag until React 19 is stable.

## Common Tasks

**Add New Game Category**: 
1. Append to `GAME_CATEGORIES` in `use-game-logic.ts`
2. Add `.wav` files to `/sounds/` with matching names
3. If sequential gameplay needed, set `requiresSequence: true`

**Adjust Difficulty**: Modify `spawnObject()` intervals, `fallSpeedMultiplier` in `use-display-adjustment.ts`, or max concurrent objects (currently 15).

**Debug Performance**: Enable overlays via `debugVisible` state in `App.tsx`. `PerformanceMonitor` shows FPS, `EventTrackerDebug` shows spawn rates, `QuickDebug` shows CSS var values.

**Change Scoring**: Only modify `handleObjectTap()` in `use-game-logic.ts`it's the sole authority for point calculation, streak tracking, and winner declaration.
