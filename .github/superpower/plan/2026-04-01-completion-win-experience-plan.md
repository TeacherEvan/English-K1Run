# Completion Win Experience Plan

## Goal

Deliver a polished, touch-first default-mode completion dialog that feels warm and celebratory, preserves the existing winner flow, improves shared dialog affordances, and adds regression coverage.

## Scope

In scope:

- `src/components/game-completion/DefaultModeCompletionDialog.tsx`
- `src/components/ui/dialog.tsx`
- `src/styles/animations/utility.css`
- `src/components/game-completion/__tests__/DefaultModeCompletionDialog.test.tsx`
- `src/test/setup.ts`

Out of scope:

- gameplay logic changes
- `src/App.tsx` winner gating changes
- locale key additions or copy rewrites
- continuous mode behavior changes

## Constraints

- Keep the existing default-mode completion flow behaviorally intact.
- Preserve accessibility announcements and reduced-motion support.
- Use the repo verification path: `npm run test:run -- src/components/game-completion/__tests__/DefaultModeCompletionDialog.test.tsx` and `npm run verify`.
- Avoid unrelated refactors.

## Tasks

### Task 1: Add regression coverage first

Create `src/components/game-completion/__tests__/DefaultModeCompletionDialog.test.tsx` covering:

- visible render state
- screen-reader announcement
- auto-dismiss after `4000ms`
- dismiss on CTA press
- clean reopen on fresh mount

Validation command:

- `npm run test:run -- src/components/game-completion/__tests__/DefaultModeCompletionDialog.test.tsx`

### Task 2: Polish the completion dialog

Update `src/components/game-completion/DefaultModeCompletionDialog.tsx` to:

- keep only `dismissed` as local state
- derive `open` from `isVisible && !dismissed`
- announce only when open
- auto-dismiss after `AUTO_CLOSE_MS`
- replace the plain body with a warmer classroom-friendly surface
- add a countdown accent bar, turtle watermark, sparkle accents, victory badge, and larger mobile-friendly CTA

### Task 3: Add shared animation support

Update `src/styles/animations/utility.css` to add:

- `@keyframes completion-countdown`
- `.animate-completion-countdown`

Apply that helper from the completion dialog and preserve reduced-motion behavior.

### Task 4: Improve shared dialog affordances

Update `src/components/ui/dialog.tsx` to:

- soften the overlay tint
- add subtle supported blur
- increase the close control to a touch-safe size
- strengthen focus visibility and touch affordance
- keep existing Radix structure and exports intact

### Task 5: Stabilize the DOM test environment

Update `src/test/setup.ts` to set the typed React `IS_REACT_ACT_ENVIRONMENT` flag while preserving existing media/audio mocks.

### Task 6: Verify the implementation

Run:

- `npm run test:run -- src/components/game-completion/__tests__/DefaultModeCompletionDialog.test.tsx`
- `npm run verify`

Expected outcome:

- focused completion dialog tests pass
- lint passes
- build passes
- existing non-blocking Vite chunk warning may remain, but must not become an error

## Expected Deliverable

A polished default-mode completion experience with stronger classroom-facing visual character, better touch ergonomics for shared dialogs, and regression coverage proving dismissal and reopen behavior.
