# Startup Loading + Intro Sync Plan

## Goal

Add a cache-first branded startup loader before welcome, keep the startup language chooser first-launch-only, and start intro audio/video from the same language-selection gesture so the intro feels simultaneous and unobstructed on mobile, tablet, and desktop.

## Architecture

- Add a startup boot stage in `src/App.tsx` and `src/app/components/AppStartupGate.tsx`.
- Keep startup persistence separate from `SettingsContext` in a small helper under `src/app/startup/`.
- Reuse `src/lib/resource-preloader/` progress tracking for the branded loading bar.
- Keep welcome sequencing in `src/components/welcome/use-welcome-sequence.ts`, but move intro activation to the language-selection gesture.
- Default startup audio cache to English + Thai only; prefetch other language packs only after selection in Settings.

## Constraints

- Prefer compact files; split helpers/tests when it improves clarity.
- Use TDD: failing tests first, then minimal implementation.
- Preserve `?e2e=1` deterministic bypass behavior.
- Preserve fallback image behavior if intro video fails.
- Do not preload all language packs on first launch.
- Use `npm --prefer-ipv4` for npm commands on this machine.

## Task 1: Persist startup gate state

Files:

- `src/app/startup/__tests__/startup-persistence.test.ts`
- `src/app/startup/startup-persistence.ts`

Changes:

- add startup-only persistence for `languageGateCompleted` and versioned `startupPackVersion`
- default to first-launch behavior when storage is missing or invalid
- add clear/reset helpers for tests and stale deployments

Validation:

- `npm --prefer-ipv4 run test:run -- src/app/startup/__tests__/startup-persistence.test.ts`

## Task 2: Build startup boot manifest and progress model

Files:

- `src/app/startup/__tests__/startup-boot-resources.test.ts`
- `src/app/startup/startup-boot-resources.ts`
- `src/app/startup/startup-boot-phase.ts`
- `src/lib/resource-preloader/types.ts`
- `src/lib/resource-preloader/orchestration.ts`

Changes:

- extend resource preloading to support video metadata
- define versioned startup resources for branded shell + intro prerequisites
- default startup audio resources to English + Thai only
- exclude non-default language audio from first-launch startup preload
- keep limited-bandwidth mode stricter than normal mode

Validation:

- `npm --prefer-ipv4 run test:run -- src/app/startup/__tests__/startup-boot-resources.test.ts`

## Task 3: Add branded startup loading UI

Files:

- `src/components/startup/__tests__/StartupLoadingScreen.test.tsx`
- `src/components/startup/StartupLoadingScreen.tsx`
- `src/components/startup/StartupLoadingScreen.css`

Changes:

- render `welcome-sangsom.png` as the loading background
- place a compact progress bar over the image
- show milestone-based labels driven by real preload progress
- keep the intro art visually dominant on all breakpoints

Validation:

- `npm --prefer-ipv4 run test:run -- src/components/startup/__tests__/StartupLoadingScreen.test.tsx`

## Task 4: Add startup boot stage to app routing

Files:

- `src/app/components/__tests__/AppStartupGate.test.tsx`
- `src/app/startup/use-startup-boot.ts`
- `src/App.tsx`
- `src/app/components/AppStartupGate.tsx`

Changes:

- add `boot | welcome | menu` startup states
- render branded startup loading before welcome in normal mode
- keep worm loading for post-menu game-start loading only
- preserve `?e2e=1` bypass to menu

Validation:

- `npm --prefer-ipv4 run test:run -- src/app/components/__tests__/AppStartupGate.test.tsx`

## Task 5: Make chooser first-launch-only and sync intro start to selection

Files:

- `src/components/welcome/__tests__/use-welcome-sequence.test.tsx`
- `src/components/welcome/__tests__/WelcomeScreen.test.tsx`
- `src/components/welcome/__tests__/WelcomeScreen.startup-gate.test.tsx`
- `src/components/welcome/intro-playback-gate.ts`
- `src/components/welcome/use-welcome-sequence.ts`
- `src/components/WelcomeScreen.tsx`
- `src/app/startup/startup-persistence.ts`

Changes:

- initialize chooser visibility from startup persistence
- mark startup language gate complete on first selection
- dismiss chooser immediately after selection
- trigger audio request and video play attempt from the same language-selection gesture
- prevent duplicate audio start when video `playing` fires later
- keep fallback image behavior and unobstructed intro layout

Validation:

- `npm --prefer-ipv4 run test:run -- src/components/welcome/__tests__/use-welcome-sequence.test.tsx src/components/welcome/__tests__/WelcomeScreen.test.tsx src/components/welcome/__tests__/WelcomeScreen.startup-gate.test.tsx`

## Task 6: Prefetch non-default language audio on demand only

Files:

- `src/app/startup/__tests__/language-audio-prefetch.test.ts`
- `src/app/startup/language-audio-prefetch.ts`
- `src/context/settings-context.tsx` or a startup/settings integration helper
- `vite-pwa-config.ts`
- `e2e/specs/startup-loading.spec.ts`
- `e2e/specs/welcome-layout.spec.ts`

Changes:

- keep English + Thai as default startup audio cache only
- prefetch only the newly selected non-default language pack after Settings changes
- skip optional language-pack warmup on limited-bandwidth/data-saver connections
- avoid duplicate prefetch when a language pack is already warmed
- extend browser coverage for first-launch loader, repeat-launch chooser skip, and intro dominance

Validation:

- `npm --prefer-ipv4 run test:run -- src/app/startup/__tests__/language-audio-prefetch.test.ts`
- `npm --prefer-ipv4 run test:e2e -- e2e/specs/startup-loading.spec.ts e2e/specs/welcome-layout.spec.ts --project=chromium`

## Task 7: Final focused verification

Run in order:

- `npm --prefer-ipv4 run test:run -- src/app/startup/__tests__/startup-persistence.test.ts src/app/startup/__tests__/startup-boot-resources.test.ts src/components/startup/__tests__/StartupLoadingScreen.test.tsx src/app/components/__tests__/AppStartupGate.test.tsx src/components/welcome/__tests__/use-welcome-sequence.test.tsx src/components/welcome/__tests__/WelcomeScreen.test.tsx src/components/welcome/__tests__/WelcomeScreen.startup-gate.test.tsx src/app/startup/__tests__/language-audio-prefetch.test.ts`
- `npm --prefer-ipv4 run test:e2e -- e2e/specs/startup-loading.spec.ts e2e/specs/welcome-layout.spec.ts --project=chromium`
- `npm --prefer-ipv4 run verify`

## Expected outcome

- branded loading appears before welcome in normal mode
- loading progress reflects real startup assets
- chooser appears only on the first true startup pass
- language selection starts intro audio/video from the same gesture
- intro remains visually dominant and unobstructed
- first-launch startup audio caches only English + Thai
- extra language audio is prefetched only after that language is selected
- repeat launches become more reliable because the startup shell and key intro assets are cached/warmed
