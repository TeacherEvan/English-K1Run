# Welcome Dock + Target Clear Plan

## Goal

Fix two linked problems without changing the core gameplay architecture:

- stop the welcome UI from blocking the hero background on desktop
- make correct-target clear progression explicit, observable, and reliably testable

## Constraints

- Keep gameplay authority in `useGameLogic`; telemetry must not drive progression.
- Preserve mobile welcome readability.
- Keep files under the repo's 200-line limit; split CSS/tests/helpers if needed.
- Use TDD where practical: add failing tests first, then implement.
- Validation order: focused tests after each task, then broader verification.

## Tasks

### Task 1: Welcome layout regression coverage

Files:

- `e2e/specs/welcome-layout.spec.ts`

Changes:

- add a desktop check proving welcome controls do not sit over the hero center
- add a mobile check proving the welcome controls still stack and center cleanly

Validation:

- `npm --prefer-ipv4 run test:e2e -- e2e/specs/welcome-layout.spec.ts --project=chromium`

### Task 2: Compact desktop welcome dock

Files:

- `src/components/WelcomeScreen.tsx`
- `src/components/WelcomeScreen.css`
- `src/components/WelcomeScreen.dock.css`
- `src/components/welcome/WelcomeLanguageShell.tsx` if needed

Changes:

- move large-screen welcome controls into a compact dock layout
- keep the background/video visually dominant
- reduce the scrim intensity
- keep mobile layout centered and readable

Validation:

- `npm --prefer-ipv4 run test:e2e -- e2e/specs/welcome-layout.spec.ts --project=chromium`

### Task 3: Target-clear seam test

Files:

- `src/hooks/game-logic/__tests__/tap-handlers-object.test.ts`

Changes:

- add a seam-level test proving a correct tapped target is removed, counted, and can trigger `levelComplete`
- assert explicit removal/progression telemetry hooks are called

Validation:

- `npm --prefer-ipv4 run test:run -- src/hooks/game-logic/__tests__/tap-handlers-object.test.ts`

### Task 4: Explicit progression telemetry

Files:

- `src/lib/event-tracker/event-tracker.ts`
- `src/hooks/game-logic/tap-handlers-object.ts`
- `src/hooks/game-logic/tap-state-updater.ts`

Changes:

- add a dedicated telemetry event for target-clear progress
- make correct-target removal reasons explicit in lifecycle tracking
- keep `targetsClearedThisLevel` as the source of truth for progression

Validation:

- `npm --prefer-ipv4 run test:run -- src/hooks/game-logic/__tests__/tap-handlers-object.test.ts src/hooks/game-logic/__tests__/tap-state-updater.test.ts src/hooks/game-logic/__tests__/inter-level-transition.test.ts`

### Task 5: Stabilize transition e2e flow

Files:

- `e2e/fixtures/game.fixture.ts`
- `e2e/specs/level-transition-countdown.spec.ts`
- `e2e/specs/gameplay.spec.ts` if needed

Changes:

- replace blind timing with state-based waits after target taps
- tighten object-tap helper visibility/wait semantics
- add the dedicated transition countdown spec promised by the level-flow work

Validation:

- `PLAYWRIGHT_PROJECTS=chromium,firefox,mobile npm --prefer-ipv4 run test:e2e -- e2e/specs/level-transition-countdown.spec.ts`

### Task 6: Final verification

Run in order:

- `npm --prefer-ipv4 run test:run -- src/hooks/game-logic/__tests__/tap-handlers-object.test.ts src/hooks/game-logic/__tests__/tap-state-updater.test.ts src/hooks/game-logic/__tests__/inter-level-transition.test.ts src/components/welcome/__tests__/WelcomeStatusPanel.test.tsx`
- `PLAYWRIGHT_PROJECTS=chromium,mobile npm --prefer-ipv4 run test:e2e -- e2e/specs/welcome-layout.spec.ts e2e/specs/level-transition-countdown.spec.ts`
- `npm --prefer-ipv4 run verify`

## Expected outcome

- the welcome UI becomes a compact desktop dock instead of a giant centered blocker
- the hero background remains visible on large screens
- correct target clears remain gameplay-driven but are easier to audit in tests and telemetry
- the transition flow becomes reliable in Playwright across supported projects
