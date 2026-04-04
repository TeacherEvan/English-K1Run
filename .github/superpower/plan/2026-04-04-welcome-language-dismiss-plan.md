# Welcome Language Dismiss Plan

## Goal

Remove the startup language chooser immediately after the player selects a language so it no longer blocks the welcome video and message.

## Architecture

Keep language persistence exactly where it already lives in `SettingsContext`. Add only a local boolean in `WelcomeScreen` to control whether the startup chooser is still rendered. Pass a simple dismissal callback down through `WelcomeLanguageShell` to `WelcomeLanguagePicker`.

## Constraints

- Do not add new persistent storage for chooser visibility.
- Keep the fix local to the existing welcome component chain.
- Keep files under the repo's 200-line limit; split tests/helpers if needed.
- Use TDD: add failing tests first, then implement.
- Run focused validation after each task and stop on failures.

## Tasks

### Task 1: Add the failing unit regression for the chooser callback

Files:

- `src/components/welcome/__tests__/WelcomeLanguagePicker.test.tsx`

Changes:

- add a unit test proving `WelcomeLanguagePicker` invokes a dismissal callback after the user selects a startup language
- keep the test wrapped in `SettingsProvider`
- verify the clicked language becomes selected

Validation:

- `npm --prefer-ipv4 run test:run -- src/components/welcome/__tests__/WelcomeLanguagePicker.test.tsx`

### Task 2: Add the failing browser regression for chooser dismissal

Files:

- `e2e/specs/welcome-layout.spec.ts`

Changes:

- extend the existing welcome layout spec with a desktop test proving the startup language shell is removed after clicking a language
- assert the welcome status panel, primary button, and video remain visible after dismissal
- keep the desktop dock placement expectation for the remaining status panel

Validation:

- `npm --prefer-ipv4 run test:e2e -- e2e/specs/welcome-layout.spec.ts --project=chromium`

### Task 3: Implement the minimal dismissal path in existing components

Files:

- `src/components/welcome/WelcomeLanguagePicker.tsx`
- `src/components/welcome/WelcomeLanguageShell.tsx`
- `src/components/WelcomeScreen.tsx`

Changes:

- add an optional `onLanguageSelected` callback to `WelcomeLanguagePicker`
- call the callback immediately after updating display and gameplay language
- pass the callback through `WelcomeLanguageShell`
- keep chooser visibility local to `WelcomeScreen` with a boolean state
- stop rendering `WelcomeLanguageShell` after selection
- add a panel modifier class so layout can collapse cleanly

Validation:

- `npm --prefer-ipv4 run test:run -- src/components/welcome/__tests__/WelcomeLanguagePicker.test.tsx`

### Task 4: Collapse the layout cleanly after the chooser is gone

Files:

- `src/components/WelcomeScreen.css`
- `src/components/WelcomeScreen.dock.css`

Changes:

- add a layout modifier for the hidden-chooser state in the shared welcome grid
- keep the remaining status panel docked correctly on large screens
- do not leave an empty visual slot where the chooser used to be

Validation:

- `npm --prefer-ipv4 run test:e2e -- e2e/specs/welcome-layout.spec.ts --project=chromium`

### Task 5: Final focused verification

Run in order:

- `npm --prefer-ipv4 run test:run -- src/components/welcome/__tests__/WelcomeLanguagePicker.test.tsx src/components/welcome/__tests__/WelcomeStatusPanel.test.tsx src/components/welcome/__tests__/welcome-phase.test.ts`
- `npm --prefer-ipv4 run test:e2e -- e2e/specs/welcome-layout.spec.ts --project=chromium`
- `npm --prefer-ipv4 run verify`

## Expected outcome

- the startup language chooser still appears initially
- selecting English or Thai dismisses it immediately
- the intro video and welcome message stay visible after that first selection
- the chosen language still persists through existing settings behavior
- no new persistent popup state is introduced
