# User Journey: Startup Welcome to Menu

## User Persona

- **Who**: Kindergarten-age child player
- **Goal**: Start the app and reach the main menu confidently
- **Context**: App opens on a touch device in a classroom or supervised home setting
- **Success Metric**: The child reaches the menu after one clear tap to start and one clear tap to continue, with no adult clarification needed

## Stage 1: App Opens

- **Doing**: Looking at the first full-screen startup display
- **Thinking**: "Is it loading, or should I touch it?"
- **Feeling**: Curious but uncertain
- **Pain points**:
  - Video-first presentation can look decorative rather than interactive
  - Audio has not started yet, so the screen must carry the instruction burden alone
- **Opportunity**:
  - Present a single large primary cue with a child-readable instruction
  - Show that the app is ready for one simple action

## Stage 2: First Tap / Narration Start

- **Doing**: Tapping the welcome screen or primary button
- **Thinking**: "Did that work?"
- **Feeling**: Hopeful, then impatient if there is no obvious feedback
- **Pain points**:
  - If narration starts, the UI still resembles a pre-start state
  - Repeated taps may happen because the child lacks confirmation that the app is now busy
- **Opportunity**:
  - Immediately switch to a listening state such as “Listening…” or equivalent localized copy
  - Animate or pulse the progress indicator as confirmation, not decoration

## Stage 3: Listening / Waiting

- **Doing**: Watching the screen while narration or fallback logic completes
- **Thinking**: "Am I waiting, or do I tap again?"
- **Feeling**: Restless if feedback is weak
- **Pain points**:
  - Safety timers are invisible to the user
  - Current CTA language does not fully explain the waiting state
- **Opportunity**:
  - Show progress text tied to the audio state
  - If fallback is triggered, keep the message reassuring rather than technical

## Stage 4: Ready to Continue

- **Doing**: Looking for the next step after narration ends or fallback unlocks
- **Thinking**: "Now I can go on"
- **Feeling**: Relieved if the next step is obvious
- **Pain points**:
  - The shift from narration completion to menu entry is fast but emotionally flat
  - The menu can feel like a new scene rather than a continuation of the welcome
- **Opportunity**:
  - Make the CTA clearly change state
  - Use a short visual handoff so the child understands the welcome is complete

## Stage 5: Menu Arrival

- **Doing**: Seeing the menu for the first time
- **Thinking**: "Now I choose what to do"
- **Feeling**: Ready, assuming there is no competing audio surprise
- **Pain points**:
  - Any new startup narration here would compete with the completed welcome flow
- **Opportunity**:
  - Keep first-arrival menu audio silent by default unless explicitly triggered by the user
  - Preserve continuity with consistent visual branding and motion tone

## Journey Risks to Avoid

- Two startup surfaces both trying to narrate
- A button label that does not match the current interaction state
- Hidden fallback behavior with no visible reassurance
- Transition timing that feels abrupt rather than intentional

## UX Success Criteria

- A child can explain the current state using one of these ideas: “tap to start,” “listen,” or “tap to continue”
- Repeated taps during narration do not feel necessary
- The menu feels like the next step of the same journey, not an unrelated screen
- Teacher intervention becomes exceptional, not routine
