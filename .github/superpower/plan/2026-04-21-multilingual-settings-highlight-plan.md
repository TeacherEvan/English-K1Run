# 2026-04-21 Multilingual Settings Highlight Plan

## Problem

Make the multilingual feature feel discoverable from the home menu and Settings so teachers and children are nudged to try other gameplay languages.

## Approach

Implement a runtime-only discovery spotlight that starts on the home-menu Settings button, clears after the first successful Settings open in the current session, and echoes the same warm gold visual language inside the Controls tab. The gameplay language selector gets the strongest emphasis, the display selector gets a lighter sibling emphasis, and reduced-motion users keep a static highlighted treatment without shimmer/pulse.

## Tasks

### Task 1 - Home-menu discovery spotlight

Files:
- `src/components/GameMenu.tsx`
- `src/components/game-menu/GameMenuHome.tsx`
- `src/components/game-menu/GameMenuSettingsDialog.tsx`
- `src/components/game-menu/__tests__/GameMenuSettingsDialog.highlight.test.tsx`

Changes:
1. Add runtime-only discovery state in `GameMenu`.
2. Pass discovery props through `GameMenuHome` into `GameMenuSettingsDialog`.
3. Clear the home-menu spotlight on the first dialog open in the current runtime session.
4. Add trigger data attributes/classes for the gold pulse/shimmer treatment.

Validation:
- `npm run test:run -- src/components/game-menu/__tests__/GameMenuSettingsDialog.highlight.test.tsx`

Checkpoint commit:
- `feat(menu): add settings discovery spotlight`

### Task 2 - Language selector spotlight styling

Files:
- `src/components/game-menu/GameMenuSettingsDialog.tsx`
- `src/components/game-menu/settings-sections/ControlSettings.tsx`
- `src/components/ui/language-selector.tsx`
- `src/components/ui/language-selector-option-content.tsx` (if needed to keep files small)
- `src/components/game-menu/game-menu-language-spotlight.css`
- `src/components/ui/__tests__/language-selector.highlight.test.tsx`

Changes:
1. Add shared spotlight CSS for the settings button, language selector triggers, and option text.
2. Give the gameplay selector a stronger `spotlight` variant.
3. Give the display selector a lighter `sibling` variant.
4. Make selector labels, current language text, and option text participate in the same treatment.
5. Keep reduced-motion mode static.

Validation:
- `npm run test:run -- src/components/game-menu/__tests__/GameMenuSettingsDialog.highlight.test.tsx src/components/ui/__tests__/language-selector.highlight.test.tsx`

Checkpoint commit:
- `feat(settings): spotlight language selectors`

### Task 3 - Final verification

Validation:
- `npm run verify`

## Notes

- Do not persist the discovery state to localStorage.
- Keep the palette warm/classroom-friendly, not neon.
- Prefer data attributes for spotlight variants so styling stays declarative.
- If `language-selector.tsx` would exceed the repo file-length guidance, split markup helpers into a sibling module.
