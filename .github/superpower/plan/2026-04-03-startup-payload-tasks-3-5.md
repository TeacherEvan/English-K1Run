# Startup Payload Safety — Tasks 3, 4 & 5

See [plan overview](2026-04-03-startup-payload-safety-plan.md) for goals and constraints.

## Task 3: Add a build artifact verifier

Prevents deployment from silently dropping welcome assets.

### Step 1: Write the verification script

- File: `scripts/check-welcome-build-assets.cjs`
- Required checks:
  - `dist/sw.js` exists
  - Required asset files exist on disk in `dist/` (e.g. `welcome-sangsom.png`, `sounds/welcome.wav`)
  - Required asset references appear in the generated service worker

### Step 2: Run before build (expect failure — no dist yet)

```bash
node scripts/check-welcome-build-assets.cjs
```

Expected: `Missing dist/sw.js`

### Step 3: Build the app

```bash
npm run build
```

Expected: vite build + PWA generateSW both succeed.

### Step 4: Run the verifier after build (expect pass)

```bash
node scripts/check-welcome-build-assets.cjs
```

Expected: `Welcome build assets verified.`

## Task 4: Wire into package scripts

### Step 1: Add script entry to `package.json`

```json
"verify:welcome-assets": "node scripts/check-welcome-build-assets.cjs"
```

### Step 2: Verify

```bash
npm run verify:welcome-assets
```

Expected: `Welcome build assets verified.`

## Task 5: Run focused regression verification

### Step 1: Unit/config verification

```bash
npm run test:run -- src/test/pwa-welcome-config.test.ts
npm run test:run -- src/lib/utils/background-preloader.test.ts
```

Expected: All targeted tests pass.

### Step 2: Production build + asset verification

```bash
npm run build
npm run verify:welcome-assets
```

Expected: Build succeeds and welcome assets verified.

### Step 3: Menu regression

```bash
PLAYWRIGHT_PROJECTS=chromium,firefox,mobile npm run test:e2e -- -g "Game Menu"
```

Expected: 33 passed.
