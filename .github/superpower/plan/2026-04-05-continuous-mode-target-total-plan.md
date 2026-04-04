# Continuous Mode Target Total Plan

## Goal

Convert `Play All Levels` / continuous mode into a single-pass score run where each level lasts `15 seconds`, gameplay shows no timer display, every correct target tap increments a cumulative total, and the home menu replaces `Best Time` with the best completed continuous-mode total targets destroyed.

## Constraints

- Keep gameplay authority inside `useGameLogic`; do not create parallel gameplay state in `App.tsx`.
- Do not change default-mode level completion flow except where shared code must branch for continuous mode.
- Continuous mode must play every level once, starting from the selected level, then end.
- Continuous mode must not show the stopwatch HUD, target timer, level-complete popup, or inter-level countdown overlay.
- Persist the best completed continuous-mode total in localStorage and surface it in the home menu.
- Keep edited files under 200 lines; split helpers when needed.
- Validation order per task: failing test(s) -> minimal implementation -> passing test(s).

## Architecture

- Add a continuous-mode level-duration constant and a selected-level-first full-pass queue helper.
- Track continuous-mode run score and active level deadline in `GameState` / hook-owned state.
- Decouple continuous-mode correct taps from progress-win rotation logic.
- Add a dedicated timed continuous-mode rotation effect that advances levels every 15 seconds and ends after one full queue pass.
- Remove continuous-mode gameplay timer UI and repurpose the home-menu hero stat card to show best total targets destroyed.

## Task 1: Continuous-mode contract tests

Files:

- `src/hooks/game-logic/__tests__/tap-state-updater.test.ts`
- `src/components/__tests__/TargetDisplay.test.tsx`
- `src/app/components/__tests__/AppGameplayScene.test.tsx`

Changes:

- add failing tests that a correct continuous-mode tap increments cumulative score without triggering winner/level rotation
- add failing test that `TargetDisplay` hides the timer block in continuous mode
- add failing test that `AppGameplayScene` does not render the stopwatch HUD in continuous mode

Validation:

- `npm run test:run -- src/hooks/game-logic/__tests__/tap-state-updater.test.ts src/components/__tests__/TargetDisplay.test.tsx src/app/components/__tests__/AppGameplayScene.test.tsx`

## Task 2: 15-second single-pass state model

Files:

- `src/lib/constants/game-config.ts`
- `src/types/game.ts`
- `src/hooks/use-game-logic-state.ts`
- `src/hooks/game-logic/game-session-types.ts`
- `src/hooks/game-logic/continuous-mode-initialization.ts`
- `src/hooks/game-logic/game-session-start.ts`
- `src/hooks/game-logic/game-session-reset.ts`
- `src/hooks/game-logic/create-continuous-mode-level-queue.ts`
- `src/hooks/game-logic/__tests__/create-continuous-mode-level-queue.test.ts`

Changes:

- add `CONTINUOUS_MODE_LEVEL_DURATION_MS = 15000`
- add state for continuous-mode run score and active level deadline
- replace best-time persistence with best-target-total persistence
- create selected-level-first full-pass queue helper for continuous mode
- reset score and deadline at run start / reset

Validation:

- `npm run test:run -- src/hooks/game-logic/__tests__/create-continuous-mode-level-queue.test.ts`

## Task 3: Decouple continuous-mode taps from win logic

Files:

- `src/hooks/game-logic/tap-state-updater.ts`
- `src/hooks/game-logic/tap-handlers-object-win.ts`
- `src/hooks/game-logic/tap-handlers-types.ts`
- `src/hooks/game-logic/tap-handlers-object.ts`
- `src/hooks/use-game-logic-interactions.ts`

Changes:

- make continuous-mode correct taps increment run total instead of using progress-win rotation
- keep default-mode completion behavior unchanged
- prevent continuous mode from reaching winner through progress

Validation:

- `npm run test:run -- src/hooks/game-logic/__tests__/tap-state-updater.test.ts`

## Task 4: Timed continuous-mode level rotation

Files:

- `src/hooks/game-logic/game-effects/inter-level-transition.ts`
- `src/hooks/game-logic/game-effects/activate-queued-level.ts`
- `src/hooks/game-logic/game-effects/continuous-mode-rotation.ts`
- `src/hooks/use-game-logic.ts`
- `src/hooks/game-logic/__tests__/continuous-mode-single-pass.test.ts`

Changes:

- extract queued-level activation helper for reuse
- add timed continuous-mode effect that advances to the next queued level every 15 seconds
- when the queue ends, finish the run, persist the best total, and set `phase = "runComplete"`
- keep default-mode popup/countdown flow untouched

Validation:

- `npm run test:run -- src/hooks/game-logic/__tests__/continuous-mode-single-pass.test.ts`

## Task 5: Remove continuous-mode timer UI

Files:

- `src/app/components/AppGameplayScene.tsx`
- `src/components/TargetDisplay.tsx`
- `src/components/__tests__/TargetDisplay.test.tsx`
- `src/app/components/__tests__/AppGameplayScene.test.tsx`

Changes:

- stop rendering `Stopwatch` in continuous mode
- stop passing `timeRemaining` to `TargetDisplay` in continuous mode
- add an explicit timer test seam on `TargetDisplay`

Validation:

- `npm run test:run -- src/components/__tests__/TargetDisplay.test.tsx src/app/components/__tests__/AppGameplayScene.test.tsx`

## Task 6: Replace home-menu stat card

Files:

- `src/App.tsx`
- `src/app/components/AppMenuOverlay.tsx`
- `src/components/GameMenu.tsx`
- `src/components/game-menu/GameMenuHome.tsx`
- `src/components/game-menu/GameMenuHero.tsx`
- `src/app/__tests__/continuous-mode-run-routing.test.tsx`
- `src/locales/en.json`
- `src/locales/fr.json`
- `src/locales/ja.json`
- `src/locales/th.json`
- `src/locales/zh-CN.json`
- `src/locales/zh-HK.json`

Changes:

- rename the prop chain from best-time semantics to best-target-total semantics
- format the total as a number, not a duration
- change the hero card label to localized `Total Targets Destroyed`
- keep continuous-mode completion from showing the default completion dialog

Validation:

- `npm run test:run -- src/app/__tests__/continuous-mode-run-routing.test.tsx`

## Task 7: Focused E2E regression coverage

Files:

- `src/lib/constants/game-config.ts` or a tiny helper seam for e2e override
- `e2e/fixtures/game.fixture.ts`
- `e2e/specs/continuous-mode-hud.spec.ts`
- `e2e/specs/menu.spec.ts`
- `e2e/specs/continuous-mode-single-pass.spec.ts`

Changes:

- update E2E coverage to assert no stopwatch/timer UI in continuous mode
- add an E2E-only duration override for fast single-pass verification
- verify continuous mode rotates automatically, skips countdown/popup UI, ends after one pass, and updates the menu stat card

Validation:

- `npm run test:e2e -- e2e/specs/menu.spec.ts e2e/specs/continuous-mode-hud.spec.ts e2e/specs/continuous-mode-single-pass.spec.ts`

## Final verification

Run in order:

- `npm run test:run -- src/hooks/game-logic/__tests__/tap-state-updater.test.ts src/hooks/game-logic/__tests__/create-continuous-mode-level-queue.test.ts src/hooks/game-logic/__tests__/continuous-mode-single-pass.test.ts src/components/__tests__/TargetDisplay.test.tsx src/app/components/__tests__/AppGameplayScene.test.tsx src/app/__tests__/continuous-mode-run-routing.test.tsx`
- `npm run verify`
- `npm run test:e2e -- e2e/specs/menu.spec.ts e2e/specs/continuous-mode-hud.spec.ts e2e/specs/continuous-mode-single-pass.spec.ts`
