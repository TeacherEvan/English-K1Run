# Visual and Audio Fixes Plan Review

**Reviewed**: 2026-04-03  
**Status**: Visual fix completed in code; audio proposal superseded by current repo policy

## Scope of this review

This file was rewritten to reflect the current repository state instead of the older implementation proposal. No other `TODO`-named markdown files were present in the repo, so this was the only unchecked plan reviewed.

## Verified current state

### Visual layering

- `src/styles/backgrounds/real-utilities.css` no longer contains the old `.app > * { z-index: 10; }` stacking-context rule.
- `src/styles/game-area.css` keeps `.game-area::before` at `z-index: 0`.
- The older visual fix proposal is therefore **already implemented**.

### Gameplay tap audio

- `src/hooks/game-logic/tap-audio-effects.ts` still intentionally returns no audio.
- `src/hooks/game-logic/tap-handlers-object.ts` still calls `playTapAudioFeedback(isCorrect)`, so the silent helper is the active behavior.
- `src/lib/sound-manager-exports.ts` still exports only `voice`, `welcome`, `stopAll`, and `targetMiss`.
- `src/hooks/__tests__/sound-manager-audio-calls.test.ts` explicitly asserts that correct and incorrect taps play nothing.
- `public/sounds/success.wav` and `public/sounds/wrong.wav` exist, but they are **not** wired into gameplay.

## Decision

- Keep the visual section marked as done.
- Do **not** implement the old `success.wav` / `wrong.wav` tap-audio proposal from this plan unless product direction changes.
- The old audio proposal conflicts with the repo's current behavior and guidance: gameplay narration is sentence-based, and tap audio is intentionally silent today.

## Evidence gathered during this review

- [x] Ran `npm run test:run`
- [x] Ran `npm run build`
- [x] Ran `npm run verify`
- [x] Confirmed relevant audio assets exist in `public/sounds/`
- [x] Confirmed existing relevant Playwright specs are present:
  - `e2e/specs/audio-overlap.spec.ts`
  - `e2e/specs/visual-ui-check.spec.ts`
  - `e2e/specs/gameplay.spec.ts`

## Updated implementation checklist

### Completed

- [x] Modify `src/styles/backgrounds/real-utilities.css`
- [x] Verify `src/styles/game-area.css` is correct
- [x] Run existing test suite: `npm run test:run`
- [x] Build project: `npm run build`
- [x] Run full verification: `npm run verify`

### Superseded by current repo policy

- [x] Do **not** add `byName()` to `src/lib/sound-manager-exports.ts` as part of this plan
- [x] Do **not** rewrite `src/hooks/game-logic/tap-audio-effects.ts` to play tap sounds
- [x] Do **not** add tap-sound preference wiring for this plan
- [x] Replace the old integration note: the active tap path is `src/hooks/game-logic/tap-handlers-object.ts`, not `use-game-logic-interactions.ts`

### Items left outside the scope of this review

| Item | Status | Note |
| --- | --- | --- |
| Create backup branch from `main` | Not done here | This review updated documentation only. |
| Document current behavior with screenshots | Not evidenced | No screenshot artifact was created during this pass. |
| Test in browser (Chrome, Firefox, Safari) | Not evidenced | No cross-browser manual run was performed. |
| Test on tablet device | Not evidenced | No physical-device pass was performed. |
| Run full Playwright suite: `npm run test:e2e` | Not run | Relevant specs were identified, but the full suite was not launched in this review. |
| Test audio playback manually in browser | Not evidenced | Current gameplay tap audio remains intentionally silent. |
| Manual QA on multiple devices | Not evidenced | No multi-device QA was performed. |
| Create PR with detailed description | Not done here | This pass stopped at repository-local review updates. |

## If this work is revisited later

Create a new plan instead of reviving the old audio section. Any future gameplay tap-audio change should first resolve these product questions:

1. Should gameplay remain sentence-only during active play?
2. Are non-verbal effects allowed, or is all tap feedback meant to stay silent?
3. Should tap feedback use the existing audio channel priorities and overlap rules?

Until those are answered, the visual work is done and the old audio work should stay closed as superseded.
