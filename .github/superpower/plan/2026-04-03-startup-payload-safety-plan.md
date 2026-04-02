# English K1 Run Implementation Plan

**Goal:** Reduce startup/install payload cost **without changing the branded welcome experience** — no changes to welcome layout, interaction, sequencing, audio behavior, or appearance.

**Architecture:** Keep all work inside the startup-performance lane:

- PWA caching and precache rules in `vite-pwa-config.ts`
- PWA wiring in `vite.config.ts`
- decorative background warming in `src/lib/utils/background-preloader.ts`
- deployment/build verification in `scripts/`

**Tech Stack:** TypeScript, React 19, Vite 7, `vite-plugin-pwa`, Vitest, Playwright

## Success criteria

The executor is done only when all of these are true:

1. `WelcomeScreen` behavior is untouched
2. welcome media remains explicitly covered in the generated build
3. decorative startup payload is reduced or constrained by policy
4. build succeeds
5. targeted verification passes
6. menu regression still passes

## Explicit no-touch zone

These files must **not** be edited in this plan:

- `src/components/WelcomeScreen.tsx`
- `src/components/welcome/use-welcome-sequence.ts`
- `src/components/welcome/use-welcome-audio-sequence.ts`
- `src/lib/audio/welcome-audio-*`
- any welcome copy/translation files
- any welcome CSS affecting layout/appearance

## Task 1: Lock in welcome-media safety with a config test

### Step 1: Write the failing test

- File: `src/test/pwa-welcome-config.test.ts`
- Code:

```ts
import { describe, expect, it } from "vitest";
import { englishK1RunPwaConfig } from "../../vite-pwa-config";

describe("englishK1RunPwaConfig", () => {
  it("keeps branded welcome media explicitly covered", () => {
    const includeAssets = englishK1RunPwaConfig.includeAssets ?? [];
    const runtimeCaching = englishK1RunPwaConfig.workbox?.runtimeCaching ?? [];

    expect(includeAssets).toContain("welcome-sangsom.png");
    expect(includeAssets).toContain("New_welcome_video.mp4");
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

### Step 2: Run the test and verify failure if coverage is missing

- Command:

```bash
npm run test:run -- src/test/pwa-welcome-config.test.ts
```

- Expected output:

```text
FAIL if welcome media coverage or background exclusion is missing
```

### Step 3: Implement the minimal config fix

- Files:
  - `vite-pwa-config.ts`
  - `vite.config.ts`

- Required implementation outcome:
  - welcome image explicitly included
  - welcome video explicitly included
  - welcome audio explicitly included
  - decorative backgrounds excluded from default precache
  - welcome media covered by explicit runtime strategy if needed

### Step 4: Re-run the test and verify success

- Command:

```bash
npm run test:run -- src/test/pwa-welcome-config.test.ts
```

- Expected output:

```text
PASS  src/test/pwa-welcome-config.test.ts
  englishK1RunPwaConfig
    ✓ keeps branded welcome media explicitly covered
    ✓ does not precache decorative background sets by default
```

## Task 2: Make decorative background warming explicitly performance-only

### Step 1: Write the failing test

- File: `src/lib/utils/background-preloader.test.ts`
- Code:

```ts
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

describe("background preloader policy", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("exports non-visual helpers used for startup performance only", async () => {
    const mod = await import("./background-preloader");

    expect(typeof mod.preloadBackgroundImages).toBe("function");
    expect(typeof mod.isBackgroundLoaded).toBe("function");
    expect(typeof mod.getBackgroundLoadingProgress).toBe("function");
  });
});
```

### Step 2: Run the test

- Command:

```bash
npm run test:run -- src/lib/utils/background-preloader.test.ts
```

- Expected output:

```text
PASS or fail only on module/test setup, not on welcome UX
```

### Step 3: Implement the minimal code path

- File: `src/lib/utils/background-preloader.ts`

- Required implementation outcome:
  - only decorative background warming behavior is touched
  - delay and idle scheduling are allowed
  - bandwidth gating is allowed
  - no coupling to welcome UI state
  - no new visual or behavioral side effects

### Step 4: Re-run the test

- Command:

```bash
npm run test:run -- src/lib/utils/background-preloader.test.ts
```

- Expected output:

```text
PASS  src/lib/utils/background-preloader.test.ts
```

## Task 3: Add a build artifact verifier so deployment can’t silently drop welcome assets

### Step 1: Write the failing verification script

- File: `scripts/check-welcome-build-assets.cjs`
- Code:

```js
const fs = require("node:fs");
const path = require("node:path");

const swPath = path.join(process.cwd(), "dist", "sw.js");

if (!fs.existsSync(swPath)) {
  console.error("Missing dist/sw.js");
  process.exit(1);
}

const sw = fs.readFileSync(swPath, "utf8");

const required = [
  "welcome-sangsom.png",
  "New_welcome_video.mp4",
  "sounds/welcome.wav",
];

const missing = required.filter((item) => !sw.includes(item));

if (missing.length > 0) {
  console.error("Missing welcome assets in generated service worker:");
  for (const item of missing) console.error(`- ${item}`);
  process.exit(1);
}

console.log("Welcome build assets verified.");
```

### Step 2: Run it before build and verify failure

- Command:

```bash
node scripts/check-welcome-build-assets.cjs
```

- Expected output:

```text
Missing dist/sw.js
```

### Step 3: Build the app

- Command:

```bash
npm run build
```

- Expected output:

```text
vite build succeeds
PWA generateSW succeeds
```

### Step 4: Run the verifier again and verify success

- Command:

```bash
node scripts/check-welcome-build-assets.cjs
```

- Expected output:

```text
Welcome build assets verified.
```

## Task 4: Add a package script so this becomes repeatable

### Step 1: Write the failing expectation

- File: `package.json`
- Add a script entry:

```json
"verify:welcome-assets": "node scripts/check-welcome-build-assets.cjs"
```

### Step 2: Run the script

- Command:

```bash
npm run verify:welcome-assets
```

- Expected output:

```text
Welcome build assets verified.
```

### Step 3: If needed, correct the script name/path only

- File: `package.json`

### Step 4: Re-run and verify success

- Command:

```bash
npm run verify:welcome-assets
```

- Expected output:

```text
Welcome build assets verified.
```

## Task 5: Run focused regression verification

### Step 1: Run unit/config verification

- Command:

```bash
npm run test:run -- src/test/pwa-welcome-config.test.ts
npm run test:run -- src/lib/utils/background-preloader.test.ts
```

- Expected output:

```text
All targeted tests pass
```

### Step 2: Run production build plus asset verification

- Command:

```bash
npm run build
npm run verify:welcome-assets
```

- Expected output:

```text
Build succeeds
Welcome build assets verified.
```

### Step 3: Run menu regression

- Command:

```bash
PLAYWRIGHT_PROJECTS=chromium,firefox,mobile npm run test:e2e -- -g "Game Menu"
```

- Expected output:

```text
33 passed
```

## What this plan deliberately does **not** do

It does **not**:

- re-encode `New_welcome_video.mp4`
- compress `welcome-sangsom.png`
- replace branded media
- change welcome timing
- change welcome playback
- touch welcome UI code

That is a separate future plan and requires explicit approval.
