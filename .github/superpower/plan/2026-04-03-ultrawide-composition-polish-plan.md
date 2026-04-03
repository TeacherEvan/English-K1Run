# Ultrawide Composition Polish Plan

## Goal

Refine the existing responsive menu and welcome compositions so ultrawide and 4K desktop layouts feel intentionally art-directed rather than merely stretched or centered.

## Scope

In scope:

- `src/components/game-menu/game-menu-adaptive.css`
- `src/components/game-menu/GameMenuHero.tsx`
- `src/components/game-menu/GameMenuHome.tsx`
- `src/components/game-menu/GameMenuLevelSelect.tsx`
- `src/components/WelcomeScreen.css`
- `src/components/WelcomeScreen.tsx`

Out of scope:

- gameplay logic changes
- localization changes
- audio sequencing changes
- mobile or tablet layout regressions beyond preserving current behavior

## Constraints

- Preserve the current touch-first menu and welcome behavior.
- Keep the warm `English K1 Run` classroom identity.
- Favor desktop composition polish through spacing, asymmetry, scale, and decorative framing rather than new heavy assets.
- Keep source files under the repo’s 200-line limit.
- Verify with `npm run verify` and focused Playwright regressions.

## Tasks

### Task 1: Measure ultrawide and 4K composition gaps

Inspect the menu and welcome layouts at wide desktop viewports such as 1728×1117, 2560×1440, and 3440×1440.

Capture:

- panel width and whitespace balance
- hero-to-action relationship
- dialog/level-select breathing room
- welcome panel placement on wide canvases

### Task 2: Polish the home menu for wide screens

Update the wide-screen menu composition to:

- use a more intentional asymmetric grid
- increase hero presence without over-stretching copy
- frame the action stack as a deliberate control dock
- add subtle decorative surface treatment for large desktops
- preserve shorter-height compact behavior from the previous pass

### Task 3: Polish level selection and shared wide surfaces

Update the level-select composition to:

- improve wide-screen panel width and rhythm
- use denser but more intentional tile distribution on large desktops
- avoid empty-feeling center alignment on ultrawide monitors

### Task 4: Polish the welcome composition for wide screens

Update the welcome layout to:

- use a deliberate two-zone composition on wide screens
- anchor language and continue panels with purposeful asymmetry
- enrich the stage background with lightweight CSS-only framing
- preserve short-height compact behavior and startup performance improvements

### Task 5: Verify implementation

Run:

- `npm run verify`
- `PLAYWRIGHT_PROJECTS=chromium,firefox,mobile npm run test:e2e -- e2e/specs/menu.spec.ts e2e/specs/settings-language.spec.ts e2e/specs/welcome-language.spec.ts`

Expected outcome:

- build and lint pass
- menu, settings, and welcome flows remain stable across the focused browser matrix
- ultrawide layouts feel more intentional in browser inspection

## Expected Deliverable

A second-pass desktop composition polish that makes the menu and welcome experiences feel designed for ultrawide and 4K displays through better visual hierarchy, asymmetry, spacing, and surface treatment without regressing mobile/tablet behavior.
