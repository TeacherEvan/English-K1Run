import { describe, expect, it } from "vitest";
import { englishK1RunPwaConfig } from "../../vite-pwa-config";

describe("englishK1RunPwaConfig", () => {
  it("keeps branded welcome media explicitly covered", () => {
    const includeAssets = englishK1RunPwaConfig.includeAssets ?? [];
    const runtimeCaching = englishK1RunPwaConfig.workbox?.runtimeCaching ?? [];

    expect(includeAssets).toContain("welcome-sangsom.png");
    expect(includeAssets).not.toContain("New_welcome_video.mp4");
    expect(includeAssets).toContain("sounds/welcome*.mp3");
    expect(includeAssets).toContain("sounds/welcome*.wav");

    const welcomeMediaRule = runtimeCaching.find((rule) =>
      String(rule.urlPattern).includes("New_welcome_video"),
    );

    expect(welcomeMediaRule).toBeDefined();
  });

  it("does not precache decorative background sets by default", () => {
    const globIgnores = englishK1RunPwaConfig.workbox?.globIgnores ?? [];
    expect(globIgnores).toContain("**/backgrounds/**");
  });
});
