# Startup Language One-Time Gate Plan

## Goal

Make the startup language chooser disappear immediately after the player selects a language so the intro video and intro messaging play unobstructed, with no further language changes available during startup.

## Architecture

Keep the selected language persisted through the existing `SettingsContext`, but keep chooser visibility and startup gating local to the welcome flow. The welcome screen should treat language selection as a one-time startup gate: once chosen, the chooser unmounts and the intro owns the screen until completion.

## Constraints

- Do not add new persistent storage for chooser visibility.
- Do not allow the chooser to re-open during startup.
- Keep the fix local to the welcome flow.
- Prefer compact files; split tests/helpers when it improves clarity.
- Use TDD: add failing tests first, then implement.
- Run focused validation after each task and stop on failures.

## Tasks

### Task 1: Add the failing browser regression for chooser disappearance and unobstructed intro

Files:

- `e2e/specs/welcome-layout.spec.ts`

Changes:

- add a startup regression proving the language chooser disappears immediately after selection
- assert the intro video, status panel, and primary button remain visible after chooser dismissal
- cover the startup path on mobile-sized viewport because mobile and desktop are equally important

Validation:

- `npm --prefer-ipv4 run test:e2e -- e2e/specs/welcome-layout.spec.ts --project=chromium`

### Task 2: Add the failing unit regression for one-time startup gating

Files:

- `src/components/welcome/__tests__/WelcomeScreen.test.tsx`

Changes:

- add a test proving the chooser stays hidden after the first startup selection
- assert the startup primary action remains available after chooser dismissal

Validation:

- `npm --prefer-ipv4 run test:run -- src/components/welcome/__tests__/WelcomeScreen.test.tsx`

### Task 3: Implement the one-time startup language gate

Files:

- `src/components/WelcomeScreen.tsx`
- `src/components/welcome/WelcomeLanguageShell.tsx`
- `src/components/welcome/WelcomeLanguagePicker.tsx`

Changes:

- keep chooser dismissal local to `WelcomeScreen`
- dismiss the chooser immediately after language selection
- do not provide any path to reopen or re-render the chooser during startup once dismissed
- keep the intro video and welcome status UI mounted and unobstructed after selection

Validation:

- `npm --prefer-ipv4 run test:run -- src/components/welcome/__tests__/WelcomeScreen.test.tsx src/components/welcome/__tests__/WelcomeLanguagePicker.test.tsx`

### Task 4: Ensure the intro owns the screen cleanly after selection

Files:

- `src/components/WelcomeScreen.css`
- `src/components/WelcomeScreen.dock.css`

Changes:

- keep `welcome-panels--language-hidden` as the only hidden-chooser layout state
- remove any empty popup-sized gap after chooser dismissal
- keep the remaining status panel visible without obstructing the intro more than necessary
- preserve both mobile and desktop startup layout quality

Validation:

- `npm --prefer-ipv4 run test:e2e -- e2e/specs/welcome-layout.spec.ts --project=chromium`

### Task 5: Verify no second startup language change path remains

Files:

- `src/components/welcome/__tests__/WelcomeScreen.test.tsx`

Changes:

- add a regression proving no startup language shell or picker is rendered after the first selection

Validation:

- `npm --prefer-ipv4 run test:run -- src/components/welcome/__tests__/WelcomeScreen.test.tsx`

### Task 6: Final verification

Run in order:

- `npm --prefer-ipv4 run test:run -- src/components/welcome/__tests__/WelcomeScreen.test.tsx src/components/welcome/__tests__/WelcomeLanguagePicker.test.tsx src/components/welcome/__tests__/WelcomeStatusPanel.test.tsx src/components/welcome/__tests__/welcome-phase.test.ts`
- `npm --prefer-ipv4 run test:e2e -- e2e/specs/welcome-layout.spec.ts --project=chromium`
- `npm --prefer-ipv4 run verify`

## Expected outcome

- the startup language chooser appears immediately on startup
- once the player selects a language, the chooser disappears immediately
- the chooser stays gone for the rest of startup
- the intro video and intro messaging are not obstructed by the chooser
- no second startup language-change path is available during startup
- later language changes remain available only in Settings/menu
- mobile and desktop both follow the same clean startup ownership model
