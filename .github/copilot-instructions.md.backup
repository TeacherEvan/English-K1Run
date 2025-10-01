docker-compose --profile dev up kindergarten-race-dev
# Copilot Instructions for Kindergarten Race Game

## Snapshot
- React 19 + TypeScript + Vite app in `src/App.tsx` orchestrates the split-screen race, mounting debug overlays and delegating gameplay to custom hooks.
- Vite config (`vite.config.ts`) exposes `@ → src`, disables FS strict mode, enables polling HMR (important for Termux/Docker), and pre-chunks Radix/animation libs—keep new modules aligned with existing `manualChunks` buckets.
- Only import `src/main.css` in `main.tsx`; add additional global styles by extending that file so Tailwind’s layer order stays intact.

## Core Loop & State
- `use-game-logic.ts` owns the gameplay: `GAME_CATEGORIES` define level content (sequence mode for “Alphabet Challenge”), `startGame` resets tracker metrics, and `handleObjectTap` is the single authority for scoring, audio, and winner detection.
- Objects spawn in batches via `spawnObject`; maintain the ≤15 active object expectation or adjust `eventTracker` warnings accordingly.
- Screen split is implicit: spawn `x <= 50` for player 1 and `> 50` for player 2, then remap to half-width inside `App.tsx`.

## Rendering & Scaling
- `use-display-adjustment.ts` sets CSS custom props (`--font-scale`, `--object-scale`, etc.) on `<html>` and provides helpers consumed by `DisplayInfo`, `PlayerArea`, and responsive Tailwind styles; read/update these variables instead of hardcoding pixel sizes.
- Background rotation and animated gradients live in `App.css`; maintain the `pickRandomBackground` pattern when adding new themes so the 30s rotation keeps working.

## UI Composition Patterns
- Game UI lives under `src/components/`; frequently re-rendered pieces (`PlayerArea`, `FallingObject`, `TargetDisplay`, `GameMenu`) are `memo`-wrapped—mirror this when adding equivalents.
- Shadcn-style primitives in `components/ui/*` use CVA + `cn` util; extend variants instead of inlining class strings when possible.
- Fireworks, debug toggles, and overlays (`FireworksDisplay`, `PerformanceMonitor`, `EventTrackerDebug`, `QuickDebug`, `ErrorMonitor`) assume they mount once in `<App />`; reuse their hooks rather than duplicating filesystem listeners.

## Telemetry & Debugging
- `src/lib/event-tracker.ts` instantiates on import, wiring global error handlers, FPS tracking, and spawn-rate warnings; prefer `eventTracker.track*` helpers over bespoke logging so overlays stay consistent.
- `ErrorMonitor` monkey-patches `console.error/warn`; keep console usage minimal or wrap noisy logs in `if (import.meta.env.DEV)` guards to avoid flooding the UI.
- `QuickDebug` expects scaling CSS vars to exist—if you add new vars through `useDisplayAdjustment`, also surface them there for diagnostics.

## Audio & Assets
- The procedural `sound-manager.ts` lazily (re)initializes Web Audio on interaction; trigger feedback with `playSoundEffect.tap/success/wrong/win` instead of custom audio tags.
- Legacy `.wav` files live under `/sounds`, but gameplay relies on generated tones today—if you swap back to files, preload them through the same manager to preserve volume + enable toggles.

## Developer Workflows
- `npm run dev` (port 5173) drives local work; for constrained devices use `npm run install:android` or `install:safe` before starting the dev server.
- Production build = `npm run build` (`tsc -b --noCheck` + `vite build`); leave `--noCheck` in place until React 19 typings stabilize.
- Docker: `docker-compose --profile dev up kindergarten-race-dev` for hot reload, `docker-compose up -d` for nginx-served bundles—watch volume mapping (`/app/node_modules`) if dependencies change.