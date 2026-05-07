# Startup Payload Safety — Tasks 1 & 2

See [plan overview](2026-04-03-startup-payload-safety-plan.md) for goals and constraints.

## Task 1: Lock in welcome-media safety with a config test

### Step 1: Write the failing test

- File: `src/test/pwa-welcome-config.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { englishK1RunPwaConfig } from "../../vite-pwa-config";

describe("englishK1RunPwaConfig", () => {
  it("keeps branded welcome media explicitly covered", () => {
    const includeAssets = englishK1RunPwaConfig.includeAssets ?? [];
    const runtimeCaching = englishK1RunPwaConfig.workbox?.runtimeCaching ?? [];

    expect(includeAssets).toContain("welcome-sangsom.png");
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
```

### Step 2: Run the test (expect failure if coverage is missing)

```bash
npm run test:run -- src/test/pwa-welcome-config.test.ts
```

### Step 3: Implement the minimal config fix

- Files: `vite-pwa-config.ts`, `vite.config.ts`
- Required outcomes:
  - welcome image and audio explicitly included in `includeAssets`
  - `New_welcome_video.mp4` NOT in `includeAssets` — rely on `welcome-media-cache-v1` runtime rule
  - `welcome-media-cache-v1` rule placed BEFORE the general audio rule
  - `maximumFileSizeToCacheInBytes` kept at 5 MB (not 25 MB)
  - decorative backgrounds excluded from precache

### Step 4: Re-run the test (expect pass)

```bash
npm run test:run -- src/test/pwa-welcome-config.test.ts
```

Expected:

```text
PASS  src/test/pwa-welcome-config.test.ts
  englishK1RunPwaConfig
    ✓ keeps branded welcome media explicitly covered
    ✓ does not precache decorative background sets by default
```

## Task 2: Make decorative background warming explicitly performance-only

### Step 1: Write the failing test

- File: `src/lib/utils/background-preloader.test.ts`

```ts
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

describe("background preloader policy", () => {
  beforeEach(() => { vi.restoreAllMocks(); });
  afterEach(() => { vi.restoreAllMocks(); });

  it("exports non-visual helpers used for startup performance only", async () => {
    const mod = await import("./background-preloader");
    expect(typeof mod.preloadBackgroundImages).toBe("function");
    expect(typeof mod.isBackgroundLoaded).toBe("function");
    expect(typeof mod.getBackgroundLoadingProgress).toBe("function");
  });
});
```

### Step 2: Run the test

```bash
npm run test:run -- src/lib/utils/background-preloader.test.ts
```

### Step 3: Implement the minimal code path

- File: `src/lib/utils/background-preloader.ts`
- Required outcomes:
  - only decorative background warming behavior is touched
  - delay and idle scheduling are allowed
  - bandwidth gating is allowed
  - no coupling to welcome UI state
  - no new visual or behavioral side effects

### Step 4: Re-run the test (expect pass)

```bash
npm run test:run -- src/lib/utils/background-preloader.test.ts
```
