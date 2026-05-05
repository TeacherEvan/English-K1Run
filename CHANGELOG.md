# Changelog

## 2026-05-05

### Changed

- Kept the welcome status panel visible during the listening phase so startup now stays readable across ready-to-start, listening, and ready-to-continue states.
- Made welcome keyboard controls phase-aware so `Enter` and `Space` can start the intro from the explicit ready state, remain blocked during narration, and continue only after startup is ready.
- Removed `Escape` as a welcome activation key to match the documented startup interaction contract.
- Updated the persisted-language Playwright reload flow to the current product rule: once the startup language gate is completed, reload skips the chooser and shows the explicit welcome start control instead.

### Added

- Added focused regression coverage for welcome-state copy, listening-state panel visibility, and phase-aware keyboard startup interaction.

### Verified

- `npx vitest run src/components/welcome/__tests__/use-welcome-sequence.test.tsx src/components/welcome/__tests__/WelcomeStatusPanel.test.tsx src/components/welcome/__tests__/WelcomeScreen.startup-gate.test.tsx src/components/welcome/__tests__/WelcomeScreen.test.tsx src/components/welcome/__tests__/use-welcome-keyboard-shortcut.test.tsx src/components/welcome/__tests__/welcome-screen-copy.test.ts src/app/startup/__tests__/startup-persistence.test.ts src/app/startup/__tests__/use-startup-boot.test.ts`
- `PLAYWRIGHT_PROJECTS=chromium npm run test:e2e -- e2e/specs/startup-loading.spec.ts e2e/specs/welcome-layout.spec.ts e2e/specs/welcome-language.spec.ts`

## 2026-04-05

### Added

- Added a focused root changelog for release-ready feature summaries and verification notes.
- Added timed continuous-mode rotation coverage with new unit tests and a focused Playwright single-pass spec.

### Changed

- Reworked `Play All Levels` into a single-pass score run where each level lasts 15 seconds and smooth transitions happen without gameplay timer UI, level-complete popup, or countdown overlay.
- Changed continuous-mode scoring to count every correct target tap and persist the best completed total in localStorage key `continuousModeBestTargetTotal`.
- Replaced the home-menu `Best Time` card with localized `Total Targets Destroyed` copy and number formatting.
- Added an E2E-only `continuousLevelMs` URL override for fast timed-rotation verification.
- Followed up the startup welcome review so repeat launches keep the chooser hidden but require an explicit intro-start gesture instead of auto-starting narration from video playback.
- Scoped optional Settings-driven welcome-audio warmup to languages with registered welcome audio assets instead of silently no-op prefetch attempts for unsupported languages.

### Verified

- `npm run test:run -- src/hooks/game-logic/__tests__/tap-state-updater.test.ts src/hooks/game-logic/__tests__/create-continuous-mode-level-queue.test.ts src/hooks/game-logic/__tests__/continuous-mode-single-pass.test.ts src/components/__tests__/TargetDisplay.test.tsx src/app/components/__tests__/AppGameplayScene.test.tsx src/app/__tests__/continuous-mode-run-routing.test.tsx`
- `npm run verify`
- `npm run test:e2e -- e2e/specs/menu.spec.ts e2e/specs/continuous-mode-hud.spec.ts e2e/specs/continuous-mode-single-pass.spec.ts`
- `npm --prefer-ipv4 run test:run -- src/components/welcome/__tests__/use-welcome-sequence.test.tsx src/components/welcome/__tests__/WelcomeScreen.test.tsx src/app/startup/__tests__/language-audio-prefetch.test.ts`
- `npm --prefer-ipv4 run test:e2e -- e2e/specs/startup-loading.spec.ts`
- `npm --prefer-ipv4 run verify`
