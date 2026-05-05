# English K1 Run Implementation Plan

**Goal:**  
Fix startup intro reliability by extending branded boot time and restoring welcome audio playback, rename the public-facing `Play All Levels` / continuous-mode UI to `Challenge Mode`, and add a Home menu `High Scores` flow that records Challenge Mode target totals with the language and achievement timestamp for each completed run.

**Architecture:**  
React 19 + TypeScript app with startup gating through `useStartupBoot` and `WelcomeScreen`, gameplay state in `useGameLogic`, menu rendering through `GameMenu`/`GameMenuHome`, translations in `src/locales/*.json`, and local persistence via `localStorage`. Internal `continuousMode` identifiers stay as-is; only public-facing UI copy changes to `Challenge Mode`.

**Tech Stack:**  
TypeScript, React 19, Vite, Vitest, Playwright, react-i18next, Radix Dialog primitives.

---

## Task 1: Make the branded startup loader stay visible longer and wait more reliably for intro readiness

**Intent:**  
Give the startup loader roughly 2x–3x more dwell time than today, while keeping resource readiness authoritative instead of adding a blind delay in the welcome screen.

### Step 1: Write failing tests for minimum boot duration and startup-loading behavior

- **Files:**
  - New: `src/app/startup/__tests__/use-startup-boot.test.ts`
  - Update: `e2e/specs/startup-loading.spec.ts`

- **Code to add:**
  - In `use-startup-boot.test.ts`, add tests that:
    - verify `ready` stays `false` until a new minimum boot duration elapses even if `preloadResources(...)` resolves immediately
    - verify `ready` becomes `true` only after both preload completion and the minimum branded duration
    - verify a warmed startup pack still returns immediate `ready: true`
  - In `startup-loading.spec.ts`, add a first-launch assertion that the boot loader remains visible while delayed image/video routes are still pending.

- **Command:**
  - `npm --prefer-ipv4 run test:run -- src/app/startup/__tests__/use-startup-boot.test.ts`
  - `npm --prefer-ipv4 run test:e2e -- e2e/specs/startup-loading.spec.ts`

- **Expected output:**
  - Unit test fails because `useStartupBoot` currently flips to ready as soon as `preloadResources(...)` resolves.
  - Playwright may fail because there is no explicit minimum branded dwell contract yet.

### Step 2: Implement boot timing helpers

- **Files:**
  - New: `src/app/startup/startup-boot-timing.ts`
  - Update: `src/app/startup/use-startup-boot.ts`

- **Code to add:**
  - In `startup-boot-timing.ts`, add constants such as:
    - `STARTUP_BOOT_MIN_MS = 2400`
    - `STARTUP_BOOT_READY_SETTLE_MS = 150`
  - In `use-startup-boot.ts`, track:
    - boot start timestamp
    - preload completion promise
    - minimum dwell promise
    - final `ready` only after both complete
  - Keep warmed-startup-pack short-circuit behavior unchanged.

- **Command:**
  - `npm --prefer-ipv4 run test:run -- src/app/startup/__tests__/use-startup-boot.test.ts`

- **Expected output:**
  - `PASS src/app/startup/__tests__/use-startup-boot.test.ts`

### Step 3: Re-run browser startup regression

- **File:**
  - `e2e/specs/startup-loading.spec.ts`

- **Command:**
  - `npm --prefer-ipv4 run test:e2e -- e2e/specs/startup-loading.spec.ts`

- **Expected output:**
  - `8 passed`

---

## Task 2: Restore welcome audio playback with the correct user-initiated `playing` contract

**Intent:**  
Fix “welcome audio doesn’t play ever” while honoring the repo rule that narration should start only after a real intro-video `playing` event from a user-initiated flow.

### Step 1: Write failing tests for first-launch and repeat-launch intro audio start

- **Files:**
  - Update: `src/components/welcome/__tests__/use-welcome-sequence.test.tsx`
  - Update: `src/components/welcome/__tests__/WelcomeScreen.test.tsx`
  - Optional update if needed: `src/components/welcome/__tests__/intro-playback-gate.test.ts`

- **Code to add:**
  - Adjust `use-welcome-sequence.test.tsx` so the expected contract becomes:
    - `handleIntroActivated(video)` does **not** call `requestStart()` immediately
    - `handleVideoPlaying()` **does** call `requestStart()` after explicit activation
    - repeat-launch `handlePrimaryAction(video)` primes intro playback, but audio still starts only on `handleVideoPlaying()`
  - Add/adjust `WelcomeScreen.test.tsx` to confirm:
    - first launch hides the chooser after language selection
    - repeat launch shows the explicit start prompt
    - neither path starts welcome audio before the `playing` event path

- **Command:**
  - `npm --prefer-ipv4 run test:run -- src/components/welcome/__tests__/use-welcome-sequence.test.tsx src/components/welcome/__tests__/WelcomeScreen.test.tsx src/components/welcome/__tests__/intro-playback-gate.test.ts`

- **Expected output:**
  - Failures showing current code starts on activation instead of on `playing`, or fails to carry pending-start state into `handleVideoPlaying()`.

### Step 2: Implement the `playing`-gated audio start flow

- **Files:**
  - Update: `src/components/welcome/use-welcome-sequence.ts`
  - Update: `src/components/WelcomeScreen.tsx`
  - Update if needed: `src/components/welcome/intro-playback-gate.ts`

- **Code to add:**
  - In `use-welcome-sequence.ts`:
    - replace immediate `requestStart()` in `handleIntroActivated(...)` with a ref like `introAudioPendingRef.current = true`
    - in `handleVideoPlaying()`, call `requestStart()` only when:
      - not E2E
      - user activation has occurred
      - audio has not started yet
      - pending audio start is armed
  - In `handlePrimaryAction(videoElement?)`, preserve the repeat-launch explicit start control:
    - if not `readyToContinue`, call `handleIntroActivated(videoElement)` to play video
    - let `handleVideoPlaying()` start narration
  - In `WelcomeScreen.tsx`, keep the chooser-hidden repeat-launch prompt and pass the video element into `handlePrimaryAction(videoRef.current)`.

- **Command:**
  - `npm --prefer-ipv4 run test:run -- src/components/welcome/__tests__/use-welcome-sequence.test.tsx src/components/welcome/__tests__/WelcomeScreen.test.tsx src/components/welcome/__tests__/intro-playback-gate.test.ts`

- **Expected output:**
  - `PASS src/components/welcome/__tests__/use-welcome-sequence.test.tsx`
  - `PASS src/components/welcome/__tests__/WelcomeScreen.test.tsx`
  - `PASS src/components/welcome/__tests__/intro-playback-gate.test.ts`

### Step 3: Re-run focused welcome browser coverage

- **Files:**
  - `e2e/specs/welcome-layout.spec.ts`
  - `e2e/specs/startup-loading.spec.ts`

- **Command:**
  - `npm --prefer-ipv4 run test:e2e -- e2e/specs/welcome-layout.spec.ts e2e/specs/startup-loading.spec.ts`

- **Expected output:**
  - All selected welcome/startup specs pass

---

## Task 3: Rename public-facing “Play All Levels / Continuous Mode” UI to “Challenge Mode”

**Intent:**  
Change public-facing labels only; preserve internal `continuousMode` state and behavior to keep the refactor safely scoped.

### Step 1: Write failing tests for menu labels and hero copy

- **Files:**
  - Update: `src/components/game-menu/__tests__/menu-action-labels.test.ts`
  - Update: `src/app/__tests__/continuous-mode-run-routing.test.tsx`
  - Update or add: `e2e/specs/menu.spec.ts`

- **Code to add:**
  - Assert menu action labels use `Challenge Mode` in English and localized equivalents in all languages.
  - Assert the Home menu no longer shows “Play All Levels” or “Continuous Mode” in player-facing UI.
  - Keep `Total Targets Destroyed` hero-card assertions unchanged.

- **Command:**
  - `npm --prefer-ipv4 run test:run -- src/components/game-menu/__tests__/menu-action-labels.test.ts src/app/__tests__/continuous-mode-run-routing.test.tsx`
  - `npm --prefer-ipv4 run test:e2e -- e2e/specs/menu.spec.ts`

- **Expected output:**
  - Failing string assertions because current locales still use “Play All Levels” / “Continuous Mode”.

### Step 2: Update all translation sources and fallback labels

- **Files:**
  - Update: `src/locales/en.json`
  - Update: `src/locales/fr.json`
  - Update: `src/locales/ja.json`
  - Update: `src/locales/th.json`
  - Update: `src/locales/zh-CN.json`
  - Update: `src/locales/zh-HK.json`
  - Update: `src/components/game-menu/constants.ts`

- **Code to add:**
  - Keep existing keys (`game.playAllLevels`, `game.continuousMode`) to minimize churn.
  - Change values to localized `Challenge Mode` wording in all six locale files.
  - Update `MENU_THAI_LABELS.playAllLevels` to the Thai `Challenge Mode` label.
  - Add any new translation keys needed for High Scores in the same pass:
    - `game.highScores`
    - `game.highScoresTitle`
    - `game.highScoresEmpty`
    - `game.targetsDestroyed`
    - `game.languageUsed`
    - `game.achievedAt`

- **Command:**
  - `npm --prefer-ipv4 run test:run -- src/components/game-menu/__tests__/menu-action-labels.test.ts src/app/__tests__/continuous-mode-run-routing.test.tsx`

- **Expected output:**
  - `PASS src/components/game-menu/__tests__/menu-action-labels.test.ts`
  - `PASS src/app/__tests__/continuous-mode-run-routing.test.tsx`

---

## Task 4: Add persistent Challenge Mode High Scores with language + achievement time

**Intent:**  
Add a Home menu `High Scores` button and dialog that lists completed Challenge Mode runs as entries containing:

- target total
- language used
- achievement timestamp

This satisfies the final design choice: **target totals only**, while still showing **when** the achievement happened.

### Step 1: Write failing storage tests

- **Files:**
  - New: `src/lib/challenge-mode-high-scores.ts`
  - New: `src/lib/__tests__/challenge-mode-high-scores.test.ts`

- **Code to add:**
  - Define a storage contract:
    - key: `challengeModeHighScores`
    - entry:

      ```ts
      interface ChallengeModeHighScoreEntry {
        score: number;
        language: SupportedLanguage;
        achievedAt: string;
      }
      ```

  - Tests should verify:
    - reading empty storage returns `[]`
    - recording a score prepends/sorts entries
    - entries are sorted by `score desc`, then `achievedAt desc`
    - helper returns top score for compatibility with the hero card
    - malformed storage falls back safely

- **Command:**
  - `npm --prefer-ipv4 run test:run -- src/lib/__tests__/challenge-mode-high-scores.test.ts`

- **Expected output:**
  - Fail because the helper module does not exist yet.

### Step 2: Implement storage helper and migrate best-score reads

- **Files:**
  - New: `src/lib/challenge-mode-high-scores.ts`
  - Update: `src/hooks/use-game-logic-state.ts`

- **Code to add:**
  - Helper functions:
    - `readChallengeModeHighScores()`
    - `recordChallengeModeHighScore(entry)`
    - `getBestChallengeModeScore()`
  - In `use-game-logic-state.ts`, initialize `continuousModeHighScore` from:
    1. best score derived from `challengeModeHighScores`
    2. fallback legacy `continuousModeBestTargetTotal`

- **Command:**
  - `npm --prefer-ipv4 run test:run -- src/lib/__tests__/challenge-mode-high-scores.test.ts`

- **Expected output:**
  - `PASS src/lib/__tests__/challenge-mode-high-scores.test.ts`

### Step 3: Write failing completion-flow tests for recording High Scores

- **Files:**
  - Update: `src/hooks/game-logic/__tests__/continuous-mode-rotation.test.ts`
  - Update: `src/app/__tests__/continuous-mode-run-routing.test.tsx`

- **Code to add:**
  - Assert a completed Challenge Mode run records:
    - `score`
    - current `gameplayLanguage`
    - ISO timestamp
  - Assert legacy `continuousModeBestTargetTotal` stays synchronized with the best recorded entry.
  - Assert the menu overlay still receives the hero-card best total.

- **Command:**
  - `npm --prefer-ipv4 run test:run -- src/hooks/game-logic/__tests__/continuous-mode-rotation.test.ts src/app/__tests__/continuous-mode-run-routing.test.tsx`

- **Expected output:**
  - Fails because current completion logic only writes the legacy best-total key.

### Step 4: Implement Challenge Mode completion recording

- **Files:**
  - Update: `src/hooks/use-game-logic.ts`
  - Update: `src/hooks/game-logic/game-effects/continuous-mode-rotation.ts`

- **Code to add:**
  - In `use-game-logic.ts`, read `gameplayLanguage` from `useSettings()`.
  - Pass `gameplayLanguage` into `useContinuousModeRotation(...)`.
  - In `continuous-mode-rotation.ts`, on run completion:
    - call `recordChallengeModeHighScore({ score, language: gameplayLanguage, achievedAt: new Date().toISOString() })`
    - update `continuousModeBestTargetTotal` only if the new run is the best total

- **Command:**
  - `npm --prefer-ipv4 run test:run -- src/hooks/game-logic/__tests__/continuous-mode-rotation.test.ts src/app/__tests__/continuous-mode-run-routing.test.tsx`

- **Expected output:**
  - `PASS src/hooks/game-logic/__tests__/continuous-mode-rotation.test.ts`
  - `PASS src/app/__tests__/continuous-mode-run-routing.test.tsx`

---

## Task 5: Add the Home menu `High Scores` dialog and wire it into the menu

**Intent:**  
Expose the recorded Challenge Mode entries in a user-friendly menu dialog while keeping the touched files easy to navigate.

### Step 1: Write failing UI tests for the new button and dialog contents

- **Files:**
  - New: `src/components/game-menu/GameMenuHighScoresDialog.tsx`
  - New: `src/components/game-menu/HighScoresList.tsx`
  - New: `src/components/game-menu/__tests__/GameMenuHighScoresDialog.test.tsx`
  - Update: `e2e/specs/menu.spec.ts`

- **Code to add:**
  - Unit test should assert:
    - Home menu shows a `High Scores` button
    - opening the dialog renders rows with:
      - score
      - native language label
      - achieved-at text
    - empty state message renders when there are no entries
  - Playwright should assert:
    - `High Scores` button is visible on the Home menu
    - clicking opens the dialog
    - one seeded score row is visible

- **Command:**
  - `npm --prefer-ipv4 run test:run -- src/components/game-menu/__tests__/GameMenuHighScoresDialog.test.tsx`
  - `npm --prefer-ipv4 run test:e2e -- e2e/specs/menu.spec.ts`

- **Expected output:**
  - Fails because the dialog/button do not exist yet.

### Step 2: Implement the dialog and wire menu props

- **Files:**
  - New: `src/components/game-menu/GameMenuHighScoresDialog.tsx`
  - New: `src/components/game-menu/high-score-formatters.ts`
  - Update: `src/components/game-menu/GameMenuHome.tsx`
  - Update: `src/components/GameMenu.tsx`
  - Update: `src/app/components/AppMenuOverlay.tsx`
  - Update: `src/App.tsx`

- **Code to add:**
  - Keep each file compact by splitting when it improves clarity:
    - dialog shell
    - formatting helpers
    - maybe list component if needed
  - `GameMenuHome` gets new props:
    - `highScores: ChallengeModeHighScoreEntry[]`
  - `GameMenu` passes `highScores` through from `AppMenuOverlay`
  - `App.tsx` reads the score list from the shared helper or from `useGameLogic`-exposed derived state
  - `GameMenuHighScoresDialog` uses `LANGUAGE_CONFIGS` to render human-friendly language names.

- **Command:**
  - `npm --prefer-ipv4 run test:run -- src/components/game-menu/__tests__/GameMenuHighScoresDialog.test.tsx src/app/__tests__/continuous-mode-run-routing.test.tsx`
  - `npm --prefer-ipv4 run test:e2e -- e2e/specs/menu.spec.ts`

- **Expected output:**
  - `PASS src/components/game-menu/__tests__/GameMenuHighScoresDialog.test.tsx`
  - `PASS src/app/__tests__/continuous-mode-run-routing.test.tsx`
  - Selected menu Playwright assertions pass

---

## Task 6: Final regression sweep

### Step 1: Run focused startup/welcome/menu suites

- **Command:**
  - `npm --prefer-ipv4 run test:run -- src/app/startup/__tests__/use-startup-boot.test.ts src/components/welcome/__tests__/use-welcome-sequence.test.tsx src/components/welcome/__tests__/WelcomeScreen.test.tsx src/components/welcome/__tests__/intro-playback-gate.test.ts src/components/game-menu/__tests__/menu-action-labels.test.ts src/components/game-menu/__tests__/GameMenuHighScoresDialog.test.tsx src/hooks/game-logic/__tests__/continuous-mode-rotation.test.ts src/app/__tests__/continuous-mode-run-routing.test.tsx src/lib/__tests__/challenge-mode-high-scores.test.ts`

- **Expected output:**
  - All targeted Vitest suites pass

### Step 2: Run focused Playwright coverage

- **Command:**
  - `npm --prefer-ipv4 run test:e2e -- e2e/specs/startup-loading.spec.ts e2e/specs/welcome-layout.spec.ts e2e/specs/menu.spec.ts`

- **Expected output:**
  - All selected Playwright specs pass

### Step 3: Run repo verification

- **Command:**
  - `npm --prefer-ipv4 run verify`

- **Expected output:**
  - lint passes
  - build passes

## Notes for execution

- Keep internal identifiers like `continuousMode` untouched unless a test proves they must change; the user asked for public name changes, not a full internal rename.
- Prefer compact new source/doc files. The most likely split points are:
  - `startup-boot-timing.ts`
  - `challenge-mode-high-scores.ts`
  - `GameMenuHighScoresDialog.tsx`
  - `high-score-formatters.ts`
- For the audio fix, do not reintroduce non-gesture auto-start paths. The intended contract is:
  1. user action starts intro video
  2. actual video `playing` event starts narration
- For High Scores, record completed Challenge Mode runs only.
