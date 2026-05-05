# Countdown-First Level Flow Plan

## Goal

Implement a countdown-first default-mode flow with these behaviors:

- default-mode levels complete after 10 correct targets
- completion flow is `level complete popup -> 5 second countdown -> next random level`
- default-mode next levels follow a non-repeating shuffle-bag order with the user-selected level first
- continuous-mode category/class changes only after 7 correct target clears
- final run completion alone triggers the true winner flow

## Constraints

- Keep gameplay state inside `useGameLogic`; do not create parallel gameplay state in `App.tsx`.
- Do not reuse `winner` for between-level transitions; use an explicit gameplay phase.
- Respect reduced motion for countdown visuals; avoid large scaling/panning effects.
- Prefer compact new and edited source/documentation files; split helpers when it improves clarity.
- Use repo checks: focused `npm run test:run -- ...`, then `npm run verify`, then focused Playwright.

## Expected architecture

- Add explicit phases to `GameState`: `idle | playing | levelComplete | interLevelCountdown | runComplete`.
- Add queue/countdown metadata to hook-owned state.
- Add a default-mode shuffle-bag helper under `src/hooks/game-logic/`.
- Add a dedicated inter-level transition effect under `src/hooks/game-logic/game-effects/`.
- Render popup/countdown from `src/app/components/AppGameplayScene.tsx` using `UI_LAYER_MATRIX`.
- Keep `winner` for final run completion only.

## Tasks

### Task 1: Progression rules first

Files:

- `src/hooks/game-logic/__tests__/tap-state-updater.test.ts`
- `src/lib/constants/game-config.ts`
- `src/types/game.ts`
- `src/hooks/use-game-logic-state.ts`
- `src/hooks/game-logic/tap-state-updater.ts`
- `src/hooks/game-logic/tap-handlers-object-win.ts`

Changes:

- write failing tests for default mode completing on 10 correct taps
- write failing tests for continuous mode rotating only after 7 clears
- add phase/countdown/queue fields to `GameState`
- change default completion threshold from 20 to 10
- change continuous category cadence from 5 to 7

Validation:

- `npm run test:run -- src/hooks/game-logic/__tests__/tap-state-updater.test.ts`

### Task 2: Default-mode shuffle bag

Files:

- `src/hooks/game-logic/__tests__/default-mode-level-queue.test.ts`
- `src/hooks/game-logic/default-mode-level-queue.ts`

Changes:

- create failing tests for selected-level-first, no duplicates, all levels once
- implement queue helper that returns `[selected, ...shuffled(others)]`

Validation:

- `npm run test:run -- src/hooks/game-logic/__tests__/default-mode-level-queue.test.ts`

### Task 3: Inter-level state machine

Files:

- `src/hooks/game-logic/__tests__/inter-level-transition.test.ts`
- `src/hooks/game-logic/game-effects/inter-level-transition.ts`
- `src/hooks/use-game-logic.ts`
- `src/hooks/use-game-logic-session.ts`
- `src/hooks/game-logic/game-session-start.ts`
- `src/hooks/game-logic/game-session-reset.ts`
- `src/hooks/game-logic/tap-handlers-object-win.ts`

Changes:

- start runs with countdown before first level play
- on ordinary default completion, enter `levelComplete`, then `interLevelCountdown`, then next level
- reserve `winner=true` for final queue completion only

Validation:

- `npm run test:run -- src/hooks/game-logic/__tests__/inter-level-transition.test.ts`

### Task 4: Level-complete popup

Files:

- `src/components/level-transition/__tests__/LevelCompletePopup.test.tsx`
- `src/components/level-transition/LevelCompletePopup.tsx`

Changes:

- add a compact professional popup for level clear
- auto-dismiss after a short timeout
- no return-to-menu behavior

Validation:

- `npm run test:run -- src/components/level-transition/__tests__/LevelCompletePopup.test.tsx`

### Task 5: 5-second countdown overlay

Files:

- `src/components/level-transition/__tests__/LevelCountdownOverlay.test.tsx`
- `src/components/level-transition/LevelCountdownOverlay.tsx`
- `src/components/level-transition/level-countdown.css`

Changes:

- render giant `5 -> 1` countdown with next-level label
- cute but calm visuals, mostly static motion
- reduced-motion-safe CSS variants

Validation:

- `npm run test:run -- src/components/level-transition/__tests__/LevelCountdownOverlay.test.tsx`

### Task 6: Scene integration

Files:

- `src/app/components/__tests__/AppGameplayScene.test.tsx`
- `src/app/components/AppGameplayScene.tsx`
- `src/lib/constants/ui-layer-matrix.ts` if needed

Changes:

- show popup during `levelComplete`
- show countdown during `interLevelCountdown`
- keep menu hidden during transitions

Validation:

- `npm run test:run -- src/app/components/__tests__/AppGameplayScene.test.tsx`

### Task 7: Freeze gameplay during transitions

Files:

- `src/app/use-target-timer.ts`
- `src/hooks/game-logic/game-effects/spawn-interval.ts`
- `src/hooks/game-logic/game-effects/animation-loop.ts`
- `src/hooks/game-logic/game-effects/fairy-cleanup.ts`
- tap-handling seam if needed

Changes:

- pause timers, spawning, falling, and taps during `levelComplete` and `interLevelCountdown`

Validation:

- `npm run test:run -- src/hooks/game-logic/__tests__/inter-level-transition.test.ts src/app/components/__tests__/AppGameplayScene.test.tsx`

### Task 8: Prefetch and announcement fixes

Files:

- `src/hooks/game-logic/game-effects/next-category-prefetch.ts`
- `src/hooks/game-logic/game-effects/target-announcement.ts`

Changes:

- prefetch queued next level instead of `level + 1`
- suppress target announcements until `phase === playing`

Validation:

- `npm run test:run -- src/hooks/game-logic/__tests__/inter-level-transition.test.ts`

### Task 9: Final-run routing only

Files:

- `src/app/__tests__/default-mode-run-routing.test.tsx`
- `src/App.tsx`
- `src/components/GameMenu.tsx`
- `src/components/game-completion/DefaultModeCompletionDialog.tsx` if needed

Changes:

- ordinary level transitions must not show menu, fireworks, or final completion dialog
- final run completion still shows end-of-run winner UI

Validation:

- `npm run test:run -- src/app/__tests__/default-mode-run-routing.test.tsx`

### Task 10: Focused Playwright coverage

Files:

- `e2e/fixtures/game.fixture.ts`
- `e2e/specs/level-transition-countdown.spec.ts`
- `e2e/specs/gameplay.spec.ts`

Changes:

- add locators for popup/countdown
- verify selected level starts first, popup appears after 10 clears, countdown begins, next level starts without menu flash

Validation:

- `npm run test:e2e -- e2e/specs/level-transition-countdown.spec.ts`

## Final verification

Run in order:

- `npm run test:run -- src/hooks/game-logic/__tests__/tap-state-updater.test.ts src/hooks/game-logic/__tests__/default-mode-level-queue.test.ts src/hooks/game-logic/__tests__/inter-level-transition.test.ts src/components/level-transition/__tests__/LevelCompletePopup.test.tsx src/components/level-transition/__tests__/LevelCountdownOverlay.test.tsx src/app/components/__tests__/AppGameplayScene.test.tsx src/app/__tests__/default-mode-run-routing.test.tsx`
- `npm run verify`
- `PLAYWRIGHT_PROJECTS=chromium,firefox,mobile npm run test:e2e -- -g "countdown|transition"`
