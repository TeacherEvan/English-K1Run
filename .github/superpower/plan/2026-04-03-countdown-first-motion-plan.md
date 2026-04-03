# Countdown-First Motion Plan

## Goal

Polish the countdown-first flow with playful-but-buoyant classroom-safe motion that improves understanding, feedback, and delight without changing gameplay routing.

## Constraints

- Keep the motion teacher-friendly and child-readable on large classroom screens.
- Respect `prefers-reduced-motion`; decorative motion must disable cleanly.
- Use CSS-first motion; do not add a new animation library.
- Use transform/opacity/progress transforms only; avoid layout animation and bounce/elastic easing.
- Keep transition copy separate from final run-completion copy.
- Keep edited files under repo size limits.
- Validation order: focused Vitest, live browser check, `npm run verify`.

## Scope

Files in scope:

- `src/components/level-transition/LevelCountdownOverlay.tsx`
- `src/components/level-transition/LevelCompletePopup.tsx`
- `src/components/level-transition/level-countdown.css`
- `src/components/level-transition/__tests__/LevelCountdownOverlay.test.tsx`
- `src/components/level-transition/__tests__/LevelCompletePopup.test.tsx`
- `src/app/components/__tests__/AppGameplayScene.test.tsx`
- `src/locales/en.json`
- `src/locales/ja.json`
- `src/locales/th.json`
- `src/locales/fr.json`
- `src/locales/zh-CN.json`
- `src/locales/zh-HK.json`

## Tasks

### Task 1: Countdown content contract

- add/get-ready eyebrow, up-next chip, support copy, progress bar, and localized live announcement
- ensure countdown stays readable at distance and keeps the next level label centered
- test file: `src/components/level-transition/__tests__/LevelCountdownOverlay.test.tsx`
- validate: `npx vitest run src/components/level-transition/__tests__/LevelCountdownOverlay.test.tsx`

### Task 2: Hero countdown motion

- add shell arrival motion, per-digit pop, subtle glow, star twinkle, and progress-bar fill
- keep motion calm and buoyant, not noisy
- add reduced-motion-safe behavior in CSS
- files: `LevelCountdownOverlay.tsx`, `level-countdown.css`
- validate: `npx vitest run src/components/level-transition/__tests__/LevelCountdownOverlay.test.tsx`

### Task 3: Level-complete handoff copy

- replace final-run style completion copy in the inter-level popup with transition-specific copy
- add transition-specific accessibility announcement
- file: `LevelCompletePopup.tsx`
- test file: `src/components/level-transition/__tests__/LevelCompletePopup.test.tsx`
- validate: `npx vitest run src/components/level-transition/__tests__/LevelCompletePopup.test.tsx`

### Task 4: Localized transition strings

- add `transition.*` and `accessibility.level*Announcement` keys in supported UI locales
- do not alter final run-completion strings used elsewhere
- files: locale JSON files listed in scope
- validate: `npx vitest run src/app/components/__tests__/AppGameplayScene.test.tsx`

### Task 5: Focused regression and live verification

- run the transition tests together
- exercise the live menu-start path and confirm the countdown overlay appears with the new copy and progress styling
- run `npm run verify`

## Final verification

Run in order:

- `npx vitest run src/components/level-transition/__tests__/LevelCountdownOverlay.test.tsx src/components/level-transition/__tests__/LevelCompletePopup.test.tsx src/app/components/__tests__/AppGameplayScene.test.tsx`
- live browser smoke check on the start-game path
- `npm run verify`
