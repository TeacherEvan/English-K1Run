import { describe, expect, it } from "vitest";

import { getWelcomePhase, isWelcomeInteractionLocked } from "../welcome-phase";

describe("welcome-phase", () => {
  it("prefers transitioning state when fade out begins", () => {
    expect(
      getWelcomePhase({
        fadeOut: true,
        readyToContinue: true,
        isSequencePlaying: false,
      }),
    ).toBe("transitioningToMenu");
  });

  it("marks narration as playing before continue is ready", () => {
    expect(
      getWelcomePhase({
        fadeOut: false,
        readyToContinue: false,
        isSequencePlaying: true,
      }),
    ).toBe("playingNarration");
  });

  it("keeps narration phase locked when ready and playing are both true", () => {
    expect(
      getWelcomePhase({
        fadeOut: false,
        readyToContinue: true,
        isSequencePlaying: true,
      }),
    ).toBe("playingNarration");
  });

  it("locks interaction only while playing or transitioning", () => {
    expect(isWelcomeInteractionLocked("readyToStart")).toBe(false);
    expect(isWelcomeInteractionLocked("readyToContinue")).toBe(false);
    expect(isWelcomeInteractionLocked("playingNarration")).toBe(true);
    expect(isWelcomeInteractionLocked("transitioningToMenu")).toBe(true);
  });
});
