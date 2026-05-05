# Welcome Intro Stability Plan

## Goal

Make the startup welcome flow reliable by dismissing the language popup immediately, letting the intro video take over the screen, starting welcome audio only after real video playback begins, and showing only `welcome-sangsom.png` if the video fails.

## Architecture

Keep language persistence in `SettingsContext`. Keep welcome sequencing in `useWelcomeSequence` and `useWelcomeAudioSequence`. Add a small intro playback gate helper so video visibility, audio arming, and fallback behavior are deterministic and testable.

## Constraints

- Do not add new persistent storage for chooser visibility.
- Keep the change local to the existing welcome flow.
- Prefer compact files; split helpers/tests when it improves clarity.
- Use TDD: add failing tests first, then implement minimal code.
- Run focused validation after each task and stop if it fails.
- Use `npm --prefer-ipv4` for npm commands on this machine.

## Tasks

### Task 1: Add a failing pure-state regression for the intro playback gate

Files:

- `src/components/welcome/__tests__/intro-playback-gate.test.ts`
- `src/components/welcome/intro-playback-gate.ts`

Changes:

- add a new pure helper test covering immediate chooser dismissal state
- prove audio is armed only until the first real video playing event
- prove video failure switches to the Sangsom fallback image and suppresses audio
- implement the minimal `createIntroPlaybackGate` helper needed to satisfy the tests

Validation:

- `npm --prefer-ipv4 run test:run -- src/components/welcome/__tests__/intro-playback-gate.test.ts`

### Task 2: Add a failing hook regression for event-gated audio start

Files:

- `src/components/welcome/__tests__/use-welcome-sequence.test.tsx`
- `src/components/welcome/use-welcome-sequence.ts`

Changes:

- add a hook-level regression proving audio does not start before the intro video is actually playing
- add a regression proving video failure marks ready-to-continue and never starts audio
- introduce hook handlers for intro activation and real video playing
- remove the early audio trigger from the primary action path so audio starts from the video-playing event instead

Validation:

- `npm --prefer-ipv4 run test:run -- src/components/welcome/__tests__/use-welcome-sequence.test.tsx`

### Task 3: Add a failing component regression for immediate dismissal and unobstructed intro

Files:

- `src/components/welcome/__tests__/WelcomeScreen.test.tsx`
- `src/components/WelcomeScreen.tsx`
- `src/components/welcome/WelcomeLanguageShell.tsx`
- `src/components/welcome/WelcomeLanguagePicker.tsx`

Changes:

- add component tests proving the intro video loads immediately after language selection
- add a regression proving the large status panel is not shown while the intro is actively playing
- keep immediate language-shell dismissal in `WelcomeScreen`
- call a new intro-activation handler when language selection completes
- load the video as soon as the chooser is gone, not only while audio is playing
- start audio from the video `playing` event and fall back cleanly on video play failure
- render the large status panel only when needed for chooser, ready/transition state, or diagnostics

Validation:

- `npm --prefer-ipv4 run test:run -- src/components/welcome/__tests__/WelcomeScreen.test.tsx`

### Task 4: Add a failing visual/browser regression for fallback image and minimal overlay

Files:

- `e2e/specs/welcome-layout.spec.ts`
- `src/components/WelcomeScreen.css`
- `src/components/WelcomeScreen.dock.css`
- `src/components/welcome/WelcomeStatusPanel.tsx` if a compact modifier is needed

Changes:

- add a desktop regression proving the intro is nearly unobstructed after language selection
- add a regression proving only the Sangsom fallback image is shown when the intro video request fails
- collapse the hidden-chooser layout cleanly with no empty popup gap
- keep any post-intro button/message in the compact desktop dock position
- do not add a new fullscreen overlay in the failure path

Validation:

- `npm --prefer-ipv4 run test:e2e -- e2e/specs/welcome-layout.spec.ts --project=chromium`

### Task 5: Final focused verification

Run in order:

- `npm --prefer-ipv4 run test:run -- src/components/welcome/__tests__/intro-playback-gate.test.ts src/components/welcome/__tests__/use-welcome-sequence.test.tsx src/components/welcome/__tests__/WelcomeScreen.test.tsx src/components/welcome/__tests__/WelcomeStatusPanel.test.tsx src/components/welcome/__tests__/WelcomeScreen.startup-gate.test.tsx`
- `npm --prefer-ipv4 run test:e2e -- e2e/specs/welcome-layout.spec.ts --project=chromium`
- `npm --prefer-ipv4 run verify`

## Expected outcome

- the startup language chooser appears once at launch
- picking English or Thai removes it immediately
- the intro video becomes visible right away after selection
- the large popup-style panel no longer blocks the school intro
- welcome audio starts only after the video is truly playing
- if the video fails, only `welcome-sangsom.png` is shown
- the player can continue once the intro path is complete without the old obstructive overlay
