import { describe, expect, it } from "vitest";
import { getStartupBootPhase } from "../startup-boot-phase";
import {
  buildStartupBootResources,
  STARTUP_PACK_VERSION,
} from "../startup-boot-resources";

describe("startup boot resources", () => {
  it("builds the normal-bandwidth startup manifest", () => {
    const resources = buildStartupBootResources(false);
    expect(resources.map((resource) => resource.url)).toEqual([
      "/welcome-sangsom.png",
      "/New_welcome_video.mp4",
      "/sounds/welcome_sangsom_association.wav",
      "/sounds/welcome_sangsom_association_thai.wav",
    ]);
    expect(STARTUP_PACK_VERSION).toBeTruthy();
  });

  it("strips warm-cache audio assets on limited bandwidth", () => {
    const resources = buildStartupBootResources(true);
    expect(resources.map((resource) => resource.url)).toEqual([
      "/welcome-sangsom.png",
      "/New_welcome_video.mp4",
    ]);
  });

  it("maps progress to stable loading phases", () => {
    expect(getStartupBootPhase(0)).toBe("branding");
    expect(getStartupBootPhase(45)).toBe("introReady");
    expect(getStartupBootPhase(80)).toBe("cacheWarm");
    expect(getStartupBootPhase(100)).toBe("complete");
  });
});
