# Startup Welcome Audio JTBD

## Scope

- Focus only on startup, welcome display, and startup audio triggers
- Explicitly out of scope: gameplay screens, gameplay logic, and in-game object/audio behavior

## Primary User Persona

- **Who**: Child player in a classroom or supervised kiosk setup
- **Secondary actor**: Teacher launches the app and may help only if the child gets stuck
- **Device**: Tablet, touch display, classroom browser
- **Environment**: Shared physical space with possible background noise and short attention span

## Core Job Statement

When a child is handed the app at launch, they want to know whether to wait, tap, or listen, so they can confidently reach the main menu without needing adult rescue.

## Supporting Job Statement

When a teacher opens the app for a child, they want startup to be predictable and self-explanatory, so the child can take over after one obvious handoff.

## Current Solution

- App boots into `welcome` unless `?e2e=1` is present
- `AppStartupGate` shows `WelcomeScreen`, then transitions to menu
- Welcome audio does **not** auto-start; it requires explicit user gesture
- Safety timers unlock progress if narration stalls or fails
- Menu startup audio is currently a no-op

## Current Pain Points

- **Ambiguous action timing**: the child may not know whether to tap immediately, wait for video, or wait for sound
- **Weak state visibility**: the CTA changes only when ready to continue, but during narration the screen still resembles a start state
- **Awkward handoff**: the move from welcome completion to menu arrival is functional but not clearly signposted as a finished step
- **Hidden safety logic**: fallback timers protect flow technically, but the user does not get reassuring feedback when fallback behavior takes over

## Consequence When It Fails

- Child taps repeatedly or stops interacting
- Teacher must step in to explain what is happening
- Startup feels unreliable even when the code path technically recovers
- Audio overlap risk becomes more noticeable if more startup narration is added later

## Why Users Hire This Startup Flow

- To feel instantly welcomed, not tested
- To know what to do with one glance or one tap
- To reach the main menu with confidence and no confusion
- To preserve the classroom handoff from teacher to child

## UX Principles for This Area

1. **One dominant action per state**
2. **One audio owner at startup**
3. **Visible progress during narration**
4. **Predictable transition into the menu**
5. **Graceful fallback without mystery**

## Product Constraints Confirmed From Code

- Welcome narration in normal mode must start only from an explicit user gesture
- E2E mode may skip or auto-complete startup steps, but production UX must not depend on that path
- Menu-side startup audio should not compete with welcome narration
- Reduced-motion support remains part of the startup contract

## Recommended UX Direction

Treat startup as a short, child-readable sequence with four distinct states:

1. **Booting** — screen appears and assets settle
2. **Ready to Start** — child sees one clear prompt to begin narration
3. **Narration Playing** — child sees that listening is in progress
4. **Ready to Continue** — child gets one clear prompt to enter the menu

This turns the current implicit timing model into an explicit, visible interaction model.
