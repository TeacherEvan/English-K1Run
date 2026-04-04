# Changelog

## 2026-04-05

### Added
- Added a focused root changelog for release-ready feature summaries and verification notes.
- Added timed continuous-mode rotation coverage with new unit tests and a focused Playwright single-pass spec.

### Changed
- Reworked `Play All Levels` into a single-pass score run where each level lasts 15 seconds and smooth transitions happen without gameplay timer UI, level-complete popup, or countdown overlay.
- Changed continuous-mode scoring to count every correct target tap and persist the best completed total in localStorage key `continuousModeBestTargetTotal`.
- Replaced the home-menu `Best Time` card with localized `Total Targets Destroyed` copy and number formatting.
- Added an E2E-only `continuousLevelMs` URL override for fast timed-rotation verification.

### Verified
- `npm run test:run -- src/hooks/game-logic/__tests__/tap-state-updater.test.ts src/hooks/game-logic/__tests__/create-continuous-mode-level-queue.test.ts src/hooks/game-logic/__tests__/continuous-mode-single-pass.test.ts src/components/__tests__/TargetDisplay.test.tsx src/app/components/__tests__/AppGameplayScene.test.tsx src/app/__tests__/continuous-mode-run-routing.test.tsx`
- `npm run verify`
- `npm run test:e2e -- e2e/specs/menu.spec.ts e2e/specs/continuous-mode-hud.spec.ts e2e/specs/continuous-mode-single-pass.spec.ts`
