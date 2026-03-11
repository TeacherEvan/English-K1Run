# User Flow: Startup Welcome and Audio Trigger Plan

## Scope

This flow covers only:

- app launch
- welcome display
- welcome narration trigger
- welcome completion
- transition into first menu view

It does not cover gameplay or in-game audio.

## Entry Point

User opens the app in normal mode.

## Flow Steps

1. **Startup Gate**: app decides whether to show welcome or skip for test mode
   - Shows welcome in normal mode
   - Skips directly to menu only for `?e2e=1`
   - Primary UX goal: production users always experience one understandable startup path

2. **Welcome Ready State**: welcome screen appears with background video or fallback image
   - Primary action: **Tap to start**
   - Required UI signals:
     - one large touch target
     - localized CTA text
     - visible focus style for keyboard users
     - no competing startup audio from menu layer

3. **Narration Playing State**: first user gesture starts welcome narration
   - Primary action: none; user is informed that listening is in progress
   - Required UI signals:
     - CTA changes from “Tap to start” to a listening/waiting state
     - progress indicator reflects narration progress
     - extra taps do not advance to menu prematurely
   - Audio rule:
     - welcome flow is the only owner of startup narration
     - narration starts only from explicit user gesture

4. **Ready to Continue State**: narration ends or safe fallback unlocks progress
   - Primary action: **Tap to continue**
   - Required UI signals:
     - CTA text changes clearly and immediately
     - visual emphasis moves from progress to next-step action
     - state should be understandable without sound

5. **Transition to Menu**: child continues into the main menu
   - Primary action: none during transition animation
   - Required UI signals:
     - short, smooth fade or bridge motion
     - no surprise narration on menu arrival
     - menu appears as the next step of the same experience

## Exit Points

- **Success**: user lands on the menu, oriented and ready to choose a next action
- **Partial**: narration fails or times out, but the child still sees a clear continue path
- **Blocked**: only true rendering or input failure should block progress

## Recommended State Model

Use these startup labels in UX copy and implementation planning:

- `booting`
- `readyToStart`
- `playingNarration`
- `readyToContinue`
- `transitioningToMenu`

## Recommended Interaction Rules

1. First tap starts narration; it does not also continue
2. Continue becomes available only when narration or fallback is complete
3. Menu arrival should be quiet by default on first load
4. If narration fails, the user still receives a friendly continue cue
5. Keyboard actions mirror touch behavior: `Enter` and `Space` activate the primary action

## Accessibility Requirements

### Keyboard Navigation

- The primary startup action must be reachable and operable via keyboard
- Tab order should land on the main welcome action first
- `Enter` and `Space` activate the same primary action as touch
- Focus indicator must remain visible over video and fallback image backgrounds

### Screen Reader Support

- Welcome status text should be announced with polite live-region behavior
- The primary button label must always match the actual current state
- Decorative video should not create noise for assistive tech
- Transition to menu should preserve a clear heading structure

### Visual Accessibility

- Text and controls must maintain WCAG AA contrast against video and image backgrounds
- Primary touch target should be comfortably larger than the minimum 24x24px target
- Progress must not rely on color alone
- Reduced-motion users should receive the same state clarity without essential animation

## Implementation Priorities for the Next Planning Step

1. Clarify the visible state during narration
2. Make the welcome→menu handoff feel intentional
3. Preserve a single startup audio owner
4. Add fallback-friendly user messaging
5. Validate with visual and E2E checks from the child’s perspective

## Notes for Handoff

- Existing code already enforces explicit user gesture for narration in normal mode
- Existing code already skips welcome in E2E mode
- Existing menu audio hook is a no-op, which aligns with the recommended single-owner startup audio model
- The main UX gap is not autoplay policy; it is state clarity during the transition from start → listening → continue → menu
