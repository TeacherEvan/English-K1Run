# Startup Welcome Audio Implementation Plan

## Scope

This plan covers only startup, welcome display, and startup audio triggers.

Out of scope:

- gameplay logic
- gameplay visuals
- in-game audio behavior
- gameplay files unless a startup dependency absolutely requires a touchpoint

## Goal

Make the startup experience easy for a child player to understand by clarifying the visible state changes across:

- tap to start
- listening
- tap to continue
- transition to menu

## Desired Outcome

After this work, a child should be able to move through startup with no adult explanation and understand the current state at a glance.

## Verified Context

- Normal users boot into the welcome path through `AppStartupGate`
- Welcome narration starts only after an explicit user gesture
- Safety timers unlock progress but must not auto-start playback
- The current menu startup audio hook is a no-op
- E2E mode may skip welcome with `?e2e=1`
- Reduced-motion support must continue to work
- The biggest current UX pain is the awkward welcome-to-menu handoff

## Implementation Strategy

Deliver the work in three passes:

1. **State clarity** — define and expose explicit welcome phases
2. **Experience polish** — improve listening feedback and menu handoff
3. **Protection** — add regression coverage for startup-only paths

## Task 1 — Define explicit welcome phases

- **Goal:** Create one clear phase model for startup, such as `readyToStart`, `playingNarration`, `readyToContinue`, and `transitioningToMenu`.
- **Likely surfaces:** `src/components/welcome/use-welcome-sequence.ts`, `src/components/welcome/use-welcome-audio-sequence.ts`, `src/components/WelcomeScreen.tsx`
- **Why it matters:** The current UX is technically safe but visually ambiguous. A child needs the screen to answer “What do I do now?” at all times.
- **Verification:** Add hook/component tests for first tap, narration completion, timer unlock, and second tap to continue.

- **Deliverables:**
  - a single startup phase source of truth
  - phase-to-CTA mapping documented in code
  - no implicit UI state derived from unrelated booleans alone

## Task 2 — Make the welcome UI stateful and child-readable

- **Goal:** Ensure the visible prompt changes with the actual startup state: Tap to start, Listening, and Tap to continue.
- **Likely surfaces:** `src/components/WelcomeScreen.tsx`, `src/components/WelcomeScreen.css`, and localized welcome/menu copy
- **Why it matters:** The user currently receives weak feedback during narration. That gap encourages repeated taps and uncertainty.
- **Verification:** Add component tests for each visible label/state and visual/E2E checks that the right prompt is visible at the right time.

- **Deliverables:**
  - one dominant CTA per phase
  - a visible listening state that does not look tappable as “continue” yet
  - accessible status text that matches the phase shown on screen

## Task 3 — Improve listening-state feedback without changing the trigger contract

- **Goal:** Add clear “listening in progress” feedback after the first gesture while preserving the existing autoplay-safe audio trigger behavior.
- **Likely surfaces:** `src/components/WelcomeScreen.tsx`, `src/components/welcome/use-welcome-sequence.ts`, `src/components/welcome/use-welcome-audio-sequence.ts`
- **Why it matters:** The first tap currently starts a process that is not explicit enough on screen.
- **Verification:** Test that the first tap starts narration once, repeated taps during listening do not advance unexpectedly, and progress/status UI appears only while narration is active.

- **Deliverables:**
  - repeat taps during narration are safely ignored or treated as no-op
  - progress/status feedback appears immediately after the first tap
  - fallback unlock messaging remains friendly and non-technical

## Task 4 — Smooth the welcome-to-menu handoff

- **Goal:** Make the transition feel intentional, with a short readable exit from welcome before the menu becomes the new focus.
- **Likely surfaces:** `src/components/welcome/use-welcome-sequence.ts`, `src/components/WelcomeScreen.tsx`, `src/app/components/AppStartupGate.tsx`, `src/App.tsx`
- **Why it matters:** This is the primary pain point identified for startup.
- **Verification:** Add an E2E or visual test that confirms ready state appears before exit and the menu becomes interactive only after the welcome overlay fully clears.

- **Deliverables:**
  - welcome completion has a visible release moment
  - menu does not appear to interrupt narration
  - transition timing remains compatible with reduced-motion settings

## Task 5 — Preserve single-owner startup audio behavior

- **Goal:** Lock down the rule that welcome owns startup narration and menu arrival stays quiet by default.
- **Likely surfaces:** `src/components/welcome/use-welcome-audio-sequence.ts`, `src/components/welcome/use-welcome-sequence.ts`, `src/hooks/use-home-menu-audio.ts`, and startup-focused tests
- **Why it matters:** This prevents overlapping or competing startup cues if future work adds more menu polish.
- **Verification:** Test that no narration starts on mount, safety timers unlock continue without playback, and exiting welcome does not trigger menu-side startup narration.

- **Deliverables:**
  - welcome remains the only startup narration owner
  - menu arrival stays silent unless a future explicit user action changes that rule
  - autoplay-safe behavior is preserved in normal mode

## Task 6 — Keep E2E and reduced-motion behavior intact

- **Goal:** Ensure startup UX improvements preserve test determinism and accessibility expectations.
- **Likely surfaces:** `src/components/welcome/use-welcome-sequence.ts`, `src/components/WelcomeScreen.tsx`, and startup-related specs under `e2e/specs/`
- **Why it matters:** A polished startup flow is still a regression if it breaks reduced-motion behavior or the E2E bypass path.
- **Verification:** Add an E2E check for `?e2e=1` menu bypass and a reduced-motion visual/accessibility check for calmer motion with equal state clarity.

- **Deliverables:**
  - E2E skip remains deterministic
  - reduced-motion users receive the same state clarity with less motion
  - no startup logic depends on timers that only exist in test mode

## Task 7 — Add a startup-only regression suite

- **Goal:** Create a compact regression suite for the startup state machine.
- **Likely surfaces:** Welcome hook/component tests and selected E2E startup specs
- **Why it matters:** Startup is now effectively a small guided state machine and should be protected like one.
- **Verification:** Cover the normal child flow, timer-unlock fallback flow, E2E skip flow, and reduced-motion flow.

- **Deliverables:**
  - one startup-focused unit/component test group
  - one startup-focused E2E path for child-visible behavior
  - one regression check for no overlapping startup audio ownership

## Acceptance Criteria

- The welcome screen always shows a single clear next action or status
- The first tap starts narration but does not also continue
- The child can tell when the app is listening versus ready to continue
- The menu appears only after the welcome flow has visibly completed
- No menu-side startup narration competes with the welcome flow
- E2E skip and reduced-motion behavior still pass validation

## Recommended Order

1. Define explicit phase state
2. Make the welcome UI stateful
3. Improve listening-state feedback
4. Smooth the welcome-to-menu handoff
5. Preserve single-owner audio rules
6. Verify E2E and reduced motion
7. Add focused regression coverage

## Suggested Verification Matrix

- **Normal mode:** tap to start → listening state → ready to continue → menu
- **Narration failure/fallback:** tap to start → fallback unlock → ready to continue → menu
- **E2E mode:** skip welcome directly to menu with `?e2e=1`
- **Reduced motion:** same states, calmer transition behavior
- **Audio ownership:** welcome audio only, no menu-start overlap

## Handoff Notes

- Start in `src/components/welcome/use-welcome-sequence.ts` and `src/components/WelcomeScreen.tsx`
- Treat `use-home-menu-audio.ts` as a boundary file, not a feature expansion point
- Do not pull gameplay state into this work; keep the change isolated to startup surfaces
