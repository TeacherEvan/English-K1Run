# Startup Welcome Audio Implementation Plan

## Scope

This plan covers only startup boot, welcome display, welcome narration trigger,
welcome completion, and the first handoff into the menu.

Out of scope:

- gameplay logic or gameplay visuals
- in-game audio behavior
- menu feature work beyond startup silence and handoff protection
- new persistence unless current seams prove insufficient

## Goal

Make startup readable for a child at every step: booting, ready to start,
listening, ready to continue, then menu arrival.

## Desired Outcome

After this work, a child should be able to reach the menu with one clear tap to
start and one clear tap to continue, without needing adult explanation.

## Verified Context

- Top-level startup routing lives in `src/App.tsx` and `src/app/components/AppStartupGate.tsx`
- App-level startup stays `boot | welcome | menu`
- Welcome narration starts only from an explicit user gesture in normal mode
- E2E may bypass welcome with `?e2e=1`
- Reduced motion must preserve state clarity
- `WelcomeScreen` also owns the startup language gate and must not regress
- Menu startup audio should remain silent by default
- Current UX gap is state clarity during start -> listening -> continue -> menu

## Implementation Strategy

Keep the app-level gate unchanged and do the behavioral work inside the welcome
slice. Deliver in four passes:

1. Lock the child-visible contract in tests
2. Normalize the welcome state model and interaction rules
3. Update rendered copy and status UI to match those states
4. Verify startup boundaries, E2E skip, reduced motion, and quiet menu arrival

## Task 1 — Lock the UX contract in tests first

- **Goal:** Freeze the intended journey before changing behavior.
- **Files:**
  - `src/components/welcome/__tests__/use-welcome-sequence.test.tsx`
  - `src/components/welcome/__tests__/use-welcome-sequence-retry.test.tsx`
  - `src/components/welcome/__tests__/WelcomeStatusPanel.test.tsx`
  - `src/components/welcome/__tests__/WelcomeScreen.test.tsx`
  - `src/components/welcome/__tests__/WelcomeScreen.startup-gate.test.tsx`
  - `e2e/specs/startup-loading.spec.ts`
  - `e2e/specs/welcome-layout.spec.ts`
  - `e2e/specs/welcome-language.spec.ts`
- **Definition of done:**
  - first tap starts narration but does not continue
  - listening state is visible and interaction-locked
  - ready-to-continue appears after narration or fallback unlock
  - language chooser still dismisses immediately after selection
  - video-failure fallback remains understandable and contract-safe

## Task 2 — Normalize the welcome state and copy model

- **Goal:** Make one source of truth for visible startup phases and labels.
- **Files:**
  - `src/components/welcome/welcome-phase.ts`
  - `src/components/welcome/welcome-screen-copy.ts`
  - extract a helper under `src/components/welcome/` if needed to stay under 200 lines
- **Definition of done:**
  - `readyToStart`, `playingNarration`, `readyToContinue`, and `transitioningToMenu` each map to one clear action label and one clear status label
  - fallback and retry messaging stay friendly
  - status-panel visibility follows the UX flow instead of ad hoc conditions

## Task 3 — Make one gesture map to one state transition

- **Goal:** Keep interaction rules explicit and consistent across touch and keyboard.
- **Files:**
  - `src/components/welcome/use-welcome-sequence.ts`
  - `src/components/welcome/use-welcome-audio-sequence.ts`
  - `src/components/welcome/use-welcome-keyboard-shortcut.ts`
- **Definition of done:**
  - first gesture starts narration only
  - repeated taps during `playingNarration` do nothing visible and do not retrigger audio
  - continue unlocks only after narration completion or safe fallback
  - second explicit action enters the menu
  - E2E behavior stays isolated behind the existing query-param seam

## Task 4 — Update the visible welcome UI without regressing the language gate

- **Goal:** Make the screen explain itself at every phase.
- **Files:**
  - `src/components/WelcomeScreen.tsx`
  - `src/components/welcome/WelcomeStatusPanel.tsx`
  - touched welcome CSS files under `src/components/`
- **Definition of done:**
  - ready state presents one obvious start action
  - listening state shows progress/status that does not rely on color alone
  - continue state shifts emphasis from progress to the next action
  - live-region and button labels match the current real state
  - fallback-image behavior still respects the current video-failure contract
  - language-shell focus restoration and dismissal still work

## Task 5 — Keep startup ownership boundaries clean

- **Goal:** Preserve boot and menu boundaries while improving the welcome slice.
- **Files:**
  - `src/App.tsx`
  - `src/app/components/AppStartupGate.tsx`
  - `src/app/startup/use-startup-boot.ts`
  - `src/app/startup/startup-persistence.ts` only if a new persisted seam is truly required
- **Definition of done:**
  - app-level startup remains `boot | welcome | menu`
  - boot still resolves to welcome in normal mode
  - welcome completion still lands in menu
  - no menu-side startup narration is introduced
  - no new persisted startup-completion flag is added unless tests prove it is necessary

## Task 6 — Close with focused regression coverage and release notes

- **Goal:** Verify the startup slice without widening to unrelated gameplay work.
- **Files:**
  - touched startup tests above
  - `CHANGELOG.md`
- **Definition of done:**
  - focused startup tests pass
  - startup E2E specs pass
  - build passes
  - changelog records the startup-flow clarification
  - no touched source or doc file exceeds the 200-line limit

## Acceptance Criteria

- The welcome screen always shows one clear next action or status
- The first tap starts narration but does not also continue
- The child can tell when the app is listening versus ready to continue
- The menu appears only after the welcome flow has visibly completed
- No menu-side startup narration competes with the welcome flow
- E2E skip, language gate behavior, and reduced-motion clarity still pass validation

## Verification Matrix

- **Welcome unit tests:** `npm run test:run -- src/components/welcome/__tests__/use-welcome-sequence.test.tsx src/components/welcome/__tests__/use-welcome-sequence-retry.test.tsx src/components/welcome/__tests__/WelcomeStatusPanel.test.tsx`
- **Startup persistence and boot tests:** `npm run test:run -- src/app/startup/__tests__/startup-persistence.test.ts src/app/startup/__tests__/use-startup-boot.test.ts`
- **Focused startup E2E:** `PLAYWRIGHT_PROJECTS=chromium npm run test:e2e -- e2e/specs/startup-loading.spec.ts e2e/specs/welcome-layout.spec.ts e2e/specs/welcome-language.spec.ts`
- **Build safety:** `npm run build`
- **Full repo guardrail before merge:** `npm run verify`

## Key Risks And Rollback Points

- Highest risk: `src/components/welcome/use-welcome-sequence.ts` already coordinates video, audio, retry, fade-out, and E2E behavior. Small changes can reintroduce autoplay or premature menu entry.
- Second risk: `src/components/WelcomeScreen.tsx` mixes language gate, panel visibility, focus restoration, and surface click behavior. Regressions here are likely to surface as startup accessibility or chooser bugs.
- Third risk: the fallback-image path has a strict contract today. UI polish must not accidentally reintroduce a large status panel on video failure.

Rollback points:

1. After Task 1, stop if the UX target conflicts with existing production constraints.
2. After Task 3, revert only the welcome-hook slice if orchestration becomes fragile.
3. After Task 4, revert only render-layer changes if the language gate or fallback contract breaks.

## Handoff Notes

- Start implementation in `src/components/welcome/use-welcome-sequence.ts` and `src/components/WelcomeScreen.tsx`
- Treat `use-home-menu-audio.ts` as a boundary file, not a feature-expansion point
- Keep the work isolated to startup surfaces unless a dependency forces one adjacent touchpoint
