# Gameplay Interaction Recovery Implementation Plan

**Date**: 2026-03-10  
**Status**: Ready for implementation  
**Scope**: Restore unobstructed gameplay interaction and align the HUD with the agreed touch-first UX.

## UX intent this plan implements

- The active play area must remain tappable across the full screen, including the bottom 10%.
- HUD elements must inform the player without covering or intercepting gameplay.
- The target indicator belongs at the top center, visible but lightweight.
- Temporary instructional bubbles or announcement cards must not appear during active play.
- Motion should support clarity, not distract or reduce tap accuracy.

## Problem statement

Players can miss valid taps because one or more overlay layers sit above falling targets. A large bubble/announcement element and a full-screen HUD wrapper reduce direct interaction in the lower screen area. Additional motion styling makes targets feel less stable than the UX intended.

## In scope

- Remove or neutralize blocking gameplay overlays.
- Keep the Back button usable without letting the HUD block object taps.
- Restore the target indicator to the center-top position.
- Remove gameplay expand/contract motion that hurts tap precision.
- Add regression coverage for bottom-zone tapping and absence of the removed bubble.

## Out of scope

- Reworking welcome flow behavior.
- New art direction or visual redesign.
- Multiplayer, scoring redesign, or audio-system changes.

## Implementation sequence

### 1. Audit live layering and interaction boundaries

**Files**: `src/app/components/AppGameplayScene.tsx`, `src/components/PlayerArea.tsx`, `src/styles/game-area.css`, `src/styles/backgrounds/real-utilities.css`

Tasks:

- Identify every gameplay-time overlay and its `z-index` / `pointer-events` behavior.
- Confirm whether `.app > *`, `.game-area > *`, or pseudo-elements create stacking-context traps.
- Verify that only intentionally interactive HUD children use `pointer-events: auto`.

Definition of done:

- A single documented layer model exists for gameplay: background < objects < hazards/effects < HUD.

### 2. Remove blocking overlay behavior

**Primary goal**: No nonessential full-screen layer may intercept taps during gameplay.

Tasks:

- Remove the gameplay bubble/announcement element from the active game scene.
- Replace any full-screen HUD container that needs layout only with `pointer-events: none`.
- Limit `pointer-events: auto` to the Back button and any other essential controls.
- Ensure hidden overlays are not kept in the DOM with active hitboxes.

Definition of done:

- Falling targets remain tappable anywhere they render, including the bottom 10% of the viewport.

### 3. Re-center and slim the target indicator

**Primary goal**: Preserve instruction visibility without covering gameplay.

Tasks:

- Keep `TargetDisplay` at top-center within the HUD layer.
- Constrain width and visual weight so it does not dominate the playfield.
- Preserve existing accessibility labeling and target emoji hooks used by tests.

Definition of done:

- The target indicator is visually centered, does not block taps, and remains readable on mobile.

### 4. Remove distracting gameplay motion

**Primary goal**: Targets should move predictably enough for quick classroom taps.

Tasks:

- Remove expand/contract or pulse effects from falling objects during active play.
- Keep only motion that communicates state or success clearly and briefly.
- Recheck reduced-motion behavior to ensure the change does not introduce regressions.

Definition of done:

- Falling objects animate only through their descent and essential state feedback.

### 5. Add regression tests

**Files**: `e2e/specs/gameplay-bottom-zone.spec.ts`, related gameplay fixtures if needed

Tasks:

- Assert the removed target-announcement bubble is absent in gameplay.
- Find a valid target intersecting the bottom 10% of the play area and tap it.
- Verify progress increases after the tap.
- Prefer geometry-based selection over brittle timing assumptions.

Definition of done:

- A failing interaction in the lower screen zone reliably breaks the suite.

## Delivery slices

### Slice A — Layering fix

- Neutralize blocking wrappers.
- Resolve stacking-context conflicts.
- Validate with manual browser inspection.

### Slice B — HUD alignment

- Keep Back button reachable.
- Keep target indicator centered and nonblocking.
- Confirm compact mobile layout.

### Slice C — Motion cleanup

- Remove expand/contract effect.
- Verify no accidental animation regressions.

### Slice D — Regression coverage

- Add bottom-zone gameplay test.
- Add absence check for removed bubble.

## Acceptance criteria

- Players can tap correct targets at the top, middle, and bottom of the play area.
- The bottom 10% of the gameplay area is not obstructed by invisible or visible overlays.
- The target indicator is centered at the top and does not intercept gameplay taps.
- The removed bubble never renders during normal gameplay.
- Falling objects no longer use the removed expand/contract effect.
- Relevant end-to-end tests pass in the local Playwright matrix (`chromium`, `firefox`, `mobile`).

## Risks and mitigations

- **Risk**: Fixing one stacking context exposes another.  
  **Mitigation**: Inspect both CSS utility layers and component wrappers before editing.
- **Risk**: Making the HUD noninteractive also disables needed controls.  
  **Mitigation**: Allow `pointer-events: auto` only on explicit controls like the Back button.
- **Risk**: Bottom-zone test becomes flaky if it depends on a single spawn.  
  **Mitigation**: Poll for a matching target and compute click coordinates from element bounds.

## Verification checklist

- Run the targeted bottom-zone gameplay spec.
- Run the broader gameplay/menu E2E subset if the HUD structure changes.
- Manually confirm in the browser that no full-screen gameplay overlay remains.
- Confirm no new TypeScript or lint errors appear in touched files.

## Handoff notes

Implementation should prioritize the smallest viable change set:

1. CSS/layering corrections first.
2. Scene-level HUD cleanup second.
3. Motion cleanup third.
4. Tests last, using the fixed behavior as the baseline.

If implementation reveals that the missing UX artifacts need to be restored formally, save them later under `.github/superpower/ux/` so future planning can trace directly back to JTBD and flow docs.
