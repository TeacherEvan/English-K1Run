import { beforeEach, describe, expect, it } from "vitest";
import {
  clearStartupState,
  getStartupState,
  hasCompletedStartupLanguageGate,
  hasReadyStartupPack,
  markStartupLanguageGateCompleted,
  markStartupPackReady,
} from "../startup-persistence";

describe("startup-persistence", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("defaults to first-launch state", () => {
    expect(getStartupState()).toEqual({
      languageGateCompleted: false,
      startupPackVersion: null,
    });
    expect(hasCompletedStartupLanguageGate()).toBe(false);
    expect(hasReadyStartupPack("boot-v1")).toBe(false);
  });

  it("persists language gate completion", () => {
    markStartupLanguageGateCompleted();
    expect(hasCompletedStartupLanguageGate()).toBe(true);
  });

  it("treats mismatched startup pack versions as stale", () => {
    markStartupPackReady("boot-v1");
    expect(hasReadyStartupPack("boot-v1")).toBe(true);
    expect(hasReadyStartupPack("boot-v2")).toBe(false);
  });

  it("clears startup state", () => {
    markStartupLanguageGateCompleted();
    markStartupPackReady("boot-v1");
    clearStartupState();
    expect(hasCompletedStartupLanguageGate()).toBe(false);
    expect(hasReadyStartupPack("boot-v1")).toBe(false);
  });
});
