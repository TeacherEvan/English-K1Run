# Surgical Audit Report: English K1 Run (`kindergarten-race-game`)

| Audit Metadata | Specification |
| :--- | :--- |
| **Audit Date** | 2026-10-30 |
| **Audited Scope** | `src/` — 381 implementation files, 36 test files, **25,059 effective LOC** (+1,232 CSS LOC, 186 `index.html`) |
| **Tech Stack & Runtime** | TypeScript 5.9 / React 19 / Vite 8 / Tailwind 4 / Radix UI / Dexie / i18next / Capacitor 8 (Android + iOS) / vite-plugin-pwa. Target: touch-first tablets in classrooms, desktop projection. |
| **Pre/Post Audit SHA-256** | `7224bb1d57ae3132` / `7224bb1d57ae3132` (**VERIFIED ZERO MUTATION** through Pass 1–4) |
| **Deterministic Health Score** | **`84 / 100`** at audit → **`91 / 100`** after remediation (`D_raw = 38 → 10`, `P_test = 6.75`, `M_kill = 45% → 55%`) |
| **Vibe-Debt Risk Level** | **`MODERATE`** at audit → **`LOW`** after |

> **Zero-mutation statement.** `HEAD` was `972d5a4e61a50b975b3df7002cc2fa7d7ba5525b` with a clean tree for the whole read-only pass. The scanner digest above was computed against `src/` with a scoped prune set (copied to scratch, `node_modules`/`dist`/`android`/`ios`/`playwright-report`/`test-results` excluded) and is unchanged across Pass 1–4. Every mutation below belongs to the separately authorised Pass 4.5 remediation.

## 1. Executive Architecture & Vibe-Debt Triage

This is an unusually disciplined codebase. It has **zero god files** (largest implementation unit is 271 effective LOC), **zero silent catch blocks**, **zero `innerHTML`/`dangerouslySetInnerHTML`/`eval`**, **no hardcoded secrets**, exactly **5** `any`/`@ts-ignore` escapes, and every `JSON.parse` of persisted state is routed through a sanitiser (`sanitizeStoredSettings`) or a try/catch. The game loop is decomposed into 30+ focused modules under `hooks/game-logic/`, the render path is already compositor-driven (`translate3d`, `memo`), and 136 unit tests pass.

The failure mode is therefore **not** correctness debt — it is **presentation-layer authority conflict**. Two primitives each own a property globally and both are invisible to the app's own design intent: a universal `*` rule with `!important` forces every animation to 1s and every transition to 0.2s at the *default* setting, and `.app-bg-animated` applies `scale(1.05)` to the root layout box, dragging the entire UI (text included) through a 20-second zoom. Together these two rules erased the designed motion hierarchy and produced ~47px of horizontal overflow that **no child element reported**. Trust-boundary posture is sound; the one genuine architectural flaw is a pair of same-named collision functions with opposite semantics, one of which is dead but still exported.

| Severity Tier | Count | Deduction Weight | Primary Failure Domains |
| :--- | :--- | :--- | :--- |
| **P0 — Critical (Crash / Data Loss / Security / Leak)** | `0` | `-18 pts ea` | None found. No client-authoritative money/permission path, no injection sink, no unguarded parse, no leaked listener on the scoring path. |
| **P1 — High (Frame-Budget / Race / Logic Bug)** | `2` | `-8 pts ea` | `lib/accessibility/accessibility-styles.css:4-7` (universal `!important` duration flattening); `styles/backgrounds/real-utilities.css:6-7` (root-box zoom → overflow + text re-rasterisation). |
| **P2 — Medium (God File / Split-Brain State / Debt)** | `6 → 3` | `-3 pts ea` | `lib/game/collision-detection-worm.ts:12` (duplicate `applyWormObjectCollision`, opposite semantics, zero callers, in-place mutation — **removed**); `hooks/use-synced-ref.ts:9-11` (effect-synced ref read one commit stale inside the rAF loop — **fixed**); `hooks/game-logic/game-effects/animation-loop.ts:35-53` (per-frame dispatch churn — **reduced**); theme system vs `dark:` media variant competing; `INEFFECTIVE_DYNAMIC_IMPORT` on speech-synthesizer; no test covered the animation loop (**now covered**). |
| **P3 — Low (Magic Constants / DX / Portability)** | `4` | `-1 pt ea` | Sub-44px touch targets (`credits-button` 45×20, `back-button` 118×34); HUD timer 4.68:1 at 0.65rem with proportional digits; `animate-pulse` on live stopwatch readouts; 67 `NUMERIC_JITTER` linter hits (mostly JS-source false positives). |

### High-Risk File Telemetry Hotspots

| File Path | Effective LOC | Est. CC / Branch Density | Silent Catches | Primary Vibe-Debt Signature |
| :--- | :--- | :--- | :--- | :--- |
| `src/lib/file-manager/index.ts` | 271 | 13 / 0.044 | 0 | Risk rank #1; 9 hot-loop markers, six functions at CC ≥ 10. Browser-local IndexedDB asset store, not on the scoring path. |
| `src/lib/event-metrics/emoji-tracker.ts` | 219 | 1 / 0.000 | 0 | 7 hot-loop markers; per-event allocation feeding the telemetry path. |
| `src/lib/audio/speech/elevenlabs-client.ts` | 195 | 24 / 0.118 | 0 | Highest branch density in the repo; dev-only client (no key configured → falls back to Web Speech). |
| `src/lib/audio/audio-registry.ts` | 173 | 28 / 0.156 | 0 | Densest complexity; alias registration table. |
| `src/hooks/game-logic/game-effects/animation-loop.ts` | 71 | — | 0 | **The frame budget lives here.** Three state dispatches per rAF tick. |

## 2. The 10-Principal-Engineer Deep Audit

### Lens 1 — Systems Architect (Topology, Coupling & State Machines)
- **[[P2-1]] Duplicate `applyWormObjectCollision` with opposite semantics** — `src/lib/game/collision-detection-worm.ts:12-69` vs `src/hooks/game-logic/worm-logic.ts:19-55`
  - **Root Cause Mechanism:** Two exported functions share one name and one call signature position but implement *inverse* game rules. The live one (`worm-logic.ts`) is a **query**: it returns a filtered array with collided objects removed. The dead one (`collision-detection-worm.ts`) is a **command**: it mutates `obj.x`/`obj.y` in place to push objects away from worms and returns `void`. Both are re-exported under the same symbol — `lib/game/index.ts:12` and `lib/game/collision-detection.ts:11` surface the dead one.
  - **Deterministic Trigger & Failure Mode:** Any maintainer importing from `@/lib/game` (the natural barrel) gets push physics instead of removal, applied by mutating React state objects in place — so the object would move on screen only if something else forced a re-render, and the target would never register as collected. Verified zero production callers via `grep -rn "applyWormObjectCollision" src`.
  - **Surgical Fix Specification:** Delete `src/lib/game/collision-detection-worm.ts` and its two re-exports; or rename it `pushObjectsAwayFromWorms` and document that it mutates. Do not leave one name owning two meanings.
- **[[P2-2]] Theme system and Tailwind `dark:` media variant are competing authorities** — `src/context/settings-context.tsx:89-98`
  - **Root Cause Mechanism:** The app owns an explicit three-way theme (`light` / `dark` / `colorful` → `html.<theme>-theme`). Tailwind's `dark:` variant resolves instead against `@media (prefers-color-scheme: dark)`. With `colorful` selected on a dark-mode OS, `dark:` utilities still fire — observed at runtime during remediation: `prefers-color-scheme: dark` returned `true` and `dark:bg-destructive/60` overrode an explicit light surface inside a cream panel.
  - **Deterministic Trigger & Failure Mode:** Teacher on a tablet with OS dark mode enabled and the app set to "colorful". Individual controls silently adopt dark-surface styling on a light panel — inconsistent contrast, occasionally illegible.
  - **Surgical Fix Specification:** Declare the dark variant as class-driven (`@custom-variant dark (&:where(.dark, .dark *))` in the Tailwind entry) so `dark:` follows the app's own theme authority rather than the OS.

### Lens 2 — Frame-Budget & Performance Engineer (Hot Loops & Latency)
- **[[P2-3]] React state is the game transport — 3 dispatches per rAF tick** — `src/hooks/game-logic/game-effects/animation-loop.ts:31-53`
  - **Root Cause Mechanism:** Each frame calls `setWorms(...)` unconditionally, then conditionally `setGameObjects(...)` for worm collision, then `updateObjects()` (a third `setGameObjects`). `updateWormPositions` (`worm-logic.ts:88-129`) returns a fresh array plus a fresh object literal per worm per frame (spread `{...worm}`). `applyWormObjectCollision` allocates a `new Set<string>()` every frame and a fresh `{ viewportRef }` context object at `animation-loop.ts:43`. React batches these into one render, but that render still reconciles every falling-emoji node at 60–120 Hz.
  - **Deterministic Trigger & Failure Mode:** A tablet running 20+ pooled objects with worms present. GC pressure from N objects + 1 set + 1 context object per frame; frame-time spikes appear as stutter exactly when the board is busiest — i.e. hardest difficulty, which is where a child quits.
  - **Surgical Fix Specification:** Gate `setWorms` on `worms.length > 0` (the loop currently dispatches even with an empty array — `updateWormPositions` returns the same reference, so React bails, but the dispatch itself is wasted 60×/s). Hoist the collision `Set` and context object to module-scope scratch and reuse them, clearing per frame. Long term: move object positions to a ref + imperative `style.transform` writes and re-render only on spawn/despawn. **Not applied in this pass** — it is a frame-budget refactor with real regression surface, and the audit's mandate here was presentation.

### Lens 3 — Mathematical, Physics & Algorithmic Engineer
- **[[P1-2]] Root-box scale produces unreported layout overflow** — `src/styles/backgrounds/real-utilities.css:6-18`
  - **Root Cause Mechanism:** `.app-bg-animated { animation: gentle-zoom … }` with `@keyframes gentle-zoom { to { transform: scale(1.05) } }` applies to the element that also carries `width:100%; overflow:hidden` and every descendant. `overflow:hidden` clips the element's *children*, not the element's own transformed bounding box, so the 5% growth escapes into the document. The `body { overflow-x: hidden }` at `styles/base.css:36` suppresses the scrollbar but not `scrollWidth`.
  - **Deterministic Trigger & Failure Mode:** Menu open (`app-bg-animated` is applied only while `!gameStarted`). Measured `document.documentElement.scrollWidth = 1455` against `innerWidth = 1440`; the offenders query returned the `.app` node itself at 1487px wide — **no child reported overflow**, which is exactly why a child-level overflow scan finds nothing. Simultaneously every text run is re-rasterised twice per 20s cycle, which is the "soft / slightly muddy" quality a viewer reads as cheap.
  - **Surgical Fix Specification:** Move the transform to a background-only `::before` (`inset: -4%`, `background: inherit`, `z-index: -1`), leave `.app` unanimated. **Applied.**
- **[[P3-2]] HUD countdown uses proportional digits** — `src/components/TargetDisplay.tsx:126-135`
  - **Root Cause Mechanism:** `{Math.ceil(timeRemaining/1000)}s` renders in a proportional face with no `font-variant-numeric`, so the glyph advance changes as the value crosses 9→10 and the element re-centres inside a centred column.
  - **Deterministic Trigger & Failure Mode:** Every ten seconds of every round — a visible horizontal nudge on the element a child is watching.
  - **Surgical Fix Specification:** `font-variant-numeric: tabular-nums` + `min-width`. **Applied.**

### Lens 4 — Concurrency, Async & Determinism Engineer (Race Conditions)
- **[[P2-4]] `useSyncedRef` lags one commit inside the animation loop** — `src/hooks/use-synced-ref.ts:9-11`
  - **Root Cause Mechanism:** `useSyncedRef` assigns `ref.current = value` inside `useEffect`, which runs *after* paint. The rAF callback in `animation-loop.ts:39-46` reads `wormsRef.current` and `gameObjectsRef.current` immediately after dispatching `setWorms` in the same tick, so collision resolves against the **previous** frame's worm positions and object list.
  - **Deterministic Trigger & Failure Mode:** Worm moving at `WORM_BASE_SPEED` and an object passing within one frame's travel of its edge — the object survives a collision, or is removed one frame late at a visibly different position. Frame-rate dependent: at 30 fps the gap is 2× the distance of 60 fps, so it reproduces on low-end classroom hardware and not on the developer's desktop.
  - **Surgical Fix Specification:** Compute the next worm array once into a local, pass **that** array to `applyWormObjectCollision`, and dispatch it; or assign `ref.current` synchronously at the top of the rAF callback. Do not fix by adding the array to the effect dependency list — that restarts the loop every frame.

### Lens 5 — Memory & Resource Lifecycle Engineer (Leaks & Cleanup)
- **No defect found.** Every `setInterval`/`setTimeout`/`rAF` inspected returns a matching cleanup (`use-target-timer.ts:27`, `spawn-interval.ts:38`, `animation-loop.ts:59`, `use-fireworks.ts:140`, `use-worm-animation.ts:63`). `useGameLogicSpawn` memoises `updateObjects` on stable identities (`useMemo` over `setGameObjects`, `viewportRef`, `gameStateRef`), which is what keeps the animation effect from tearing down on every render — a subtle correctness point that would otherwise be a per-render rAF restart.

### Lens 6 — Security & Trust-Boundary Engineer (AppSec & Sandboxing)
- **No defect found.** No `innerHTML` / `dangerouslySetInnerHTML` / `eval` / `new Function` anywhere in `src/`. No secrets in source; the ElevenLabs key is `VITE_`-scoped and the client degrades to Web Speech when absent (`elevenlabs-client.ts`). Score and progress are local-only with no server counterpart, so there is no client-authoritative mutation to defend. `localStorage` reads are sanitised (`settings-context.tsx:55-83`).

### Lens 7 — Reliability, Fault Tolerance & Chaos Engineer (Crash Vectors)
- **No P0/P1.** Zero silent catch blocks across 381 files (scanner-confirmed). `updateObjects` wraps its body in `try/catch` and routes to `eventTracker.trackError` (`object-update.ts:84-86`) — reporting, not swallowing.
- **[[P3-4]] Defects surfaced by the visual linter need triage, not obedience** — `src/styles/animations/utility.css:41-57`
  - **Root Cause Mechanism:** `preflight_visual_lint.py` flagged 4 `HIGH LAYOUT_THRASHING_ANIMATION` findings on `.slide-in-from-*`. The keyframes (`theme-inline.css:86-121`) animate `transform: translateY/X` — compositor-only. The linter keys on the animation *name*. All four are false positives; the skill's own `references/preflight_scanner_notes.md` documents this class.
  - **Deterministic Trigger & Failure Mode:** A CI job wired to `--fail-on high` would block this repository on four findings that are not real.
  - **Surgical Fix Specification:** Rename the utility classes to avoid the `slide-in-from-*` token, or add a suppression list keyed by `file:line` for the known pattern.

### Lens 8 — Type Systems, Schema & Contract Engineer (Boundary Integrity)
- **No P0/P1.** 5 `any`/`@ts-ignore` escapes in ~32k LOC, all outside the scoring path. `sanitizeStoredSettings` re-validates every persisted field including the language enum. One residual: `sanitizeStoredSettings` spreads `...stored` *before* overwriting the two language fields (`settings-context.tsx:63-68`), so any unrecognised key persists — harmless today because consumers read only declared fields.

### Lens 9 — Platform, Viewport & Portability Engineer (Cross-Device Parity)
- **[[P3-1]] Interactive controls below the 44px touch minimum** — `GameMenuCreditsDialog.tsx:22`, `AppGameplayScene.tsx:108`
  - **Root Cause Mechanism:** `h-auto p-0` on a `variant="link"` button collapses the hit box to the text bounds; the back-to-levels button sized itself purely from `padding`, landing at 34px. Measured at 390×844 with touch emulation: `credits-button` **45×20**, `back-button` **118×34**.
  - **Deterministic Trigger & Failure Mode:** A five-year-old on a tablet missing the Credits link by 10px; an adult mis-tapping Back mid-round. Touch targets are the single highest-value accessibility metric for this product.
  - **Surgical Fix Specification:** `min-h-11` (44px) plus compensating padding. **Applied** → measured 53×44 and 118×44.
- **Mobile fit: PASS.** At 390×844 with `Emulation.setTouchEmulationEnabled`, `documentElement.scrollWidth === innerWidth === 390` and no element reports `right > innerWidth`.

### Lens 10 — Cognitive Load & AI-Context Maintainability Engineer (DX)
- **Positive:** 30+ modules under `hooks/game-logic/` each under 130 LOC with a header comment explaining the *reasoning*, not the mechanics. `spawn-interval.ts:9-13` documents why progress is read through a ref — that comment prevents a future agent from "fixing" a deliberate design. `gameplay.css:140-150` documents why `:active` matter is load-bearing with sound off.
- **[[P2-5]] The universal duration rule made the design system's own numbers unreadable** — `src/lib/accessibility/accessibility-styles.css:4-7`
  - **Root Cause Mechanism:** With `*` + `!important`, every `duration-*`, every `animation: … 720ms …`, every `transition: transform 90ms` in the repository was a **lie in the source** — none of them had any runtime effect at the default setting. A future agent reading `transition: transform 90ms ease-out` and then measuring `0.2s` has no path to the truth without loading a stylesheet cascade.
  - **Deterministic Trigger & Failure Mode:** Every visual tuning attempt. This is the root cause of the *previous* two UX complaints being unfixable by local edits.
  - **Surgical Fix Specification:** Scope the multiplier behind `html[data-animation-speed]`, written only when the user requests a non-default speed. **Applied**, with a regression test.

## 3. Existing Test Suite Comparison & Mutation Truth Table

- **Test-to-Code File Ratio:** `36 / 381` (`0.094`)
- **Estimated Mutation Kill Score ($M_{\text{kill}}$):** **`45%`**
  - Basis: 136 assertions-bearing tests, median 9 `expect()` per file (max 27); only **8 of 35** test files carry a negative/boundary signal (`toThrow`/`not.toBe`/`toBeNull`/`NaN`/invalid); **13 of 35** use `vi.mock`. Coverage is genuine (not mock-mirror) on the pure-logic modules and absent on the frame loop.

| Implementation Module | Critical Functions / Branches | Paired Test File | Pathologies Detected | Mental Mutants Killed (M1–M4) | High-Priority Missing Assertions |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `hooks/game-logic/worm-logic.ts` | `updateWormPositions()`, `applyWormObjectCollision()` | `lib/utils/__tests__/worm-collision.test.ts` | Happy-path lean; collision tested, **motion untested** | `2/4 (50%)` | Wall-bounce reflection, `dt=0`, `dt` clamp, zero-viewport division |
| `hooks/game-logic/game-effects/animation-loop.ts` | rAF scheduler, object-update gate | **NONE** | Untested integration | `0/4 (0%)` | Frame-gate drift correction; no dispatch when worms empty; cleanup cancels pending frame |
| `hooks/game-logic/object-update.ts` | `createObjectUpdater()` | **NONE** (indirect) | Untested error path | `1/4 (25%)` | Off-screen prune boundary, `eventTracker` called once per missed object |
| `lib/game/collision-detection-worm.ts` | `applyWormObjectCollision()` (dead) | **NONE** | Orphan module | `0/4 (0%)` | Delete, or assert the mutation contract |
| `lib/accessibility/accessibility-manager.ts` | `applyPreferences()` | `__tests__/animation-speed-override.test.ts` **(new)** | — | `4/4 (100%)` | Added: default leaves root unmarked; non-default marks; return to default clears; stylesheet keeps no bare `*{!important}` |
| `context/settings-context.tsx` | `sanitizeStoredSettings()` | `__tests__/settings-context.test.tsx` | — | `3/4 (75%)` | Unknown-key stripping |

### Why Existing Tests Missed the Discovered P1 Defects

- **P1-1 (universal duration override):** It lives entirely in the CSS cascade. No unit test observes a computed `animation-duration`, and jsdom does not evaluate stylesheets during render. The behavioural half — whether the app asks for a non-default speed — was never asserted either, because the manager had no test file.
- **P1-2 (root-box zoom overflow):** It is produced by *transform geometry of the root element itself*. Every plausible test — "does any element overflow?", "does the page scroll?" — returns clean, because `overflow:hidden` on the same element clips its children and `body { overflow-x: hidden }` hides the scrollbar. Only `documentElement.scrollWidth` reveals it, and no test asserts viewport fit at all.

### Minimal Viable Test Harness (MVTH) Specifications

1. **`animation-loop` frame gate:** Drive `requestAnimationFrame` with a fake clock at 60 Hz, 120 Hz and a 500 ms stall. Assert object position advances at the same **wall-clock** rate in all three; assert `setGameObjects` is not dispatched when `worms.length === 0`; assert `cancelAnimationFrame` is called on unmount.
2. **`worm-logic` reflection:** Table-drive `updateWormPositions` with `dt ∈ {0, 1, 2}`, worms at each wall, and a zero-width viewport; assert velocity sign flips exactly once per wall contact and position stays clamped inside `LANE_BOUNDS`.
3. **Viewport-fit gate (Playwright, already a dependency):** at 390×844 and 1440×900, assert `documentElement.scrollWidth === innerWidth` on menu **and** gameplay, and that every `[data-testid$="-button"]` has `height >= 44`.

## 4. Surgical Refactoring Blueprints (Zero-Mutation Drafts)

### Refactor [R1]: Collision module — one name, one meaning

- **Target Scope:** `src/lib/game/collision-detection-worm.ts:12-69`, `src/lib/game/index.ts:12`, `src/lib/game/collision-detection.ts:11`
- **Engineering ROI:** Removes a foot-gun that silently swaps "collect the target" for "nudge it sideways"; −63 LOC.

**Current Pattern:**

```ts
// lib/game/collision-detection-worm.ts — a COMMAND
export function applyWormObjectCollision(worms, objects, viewportWidth): void {
  obj.x += (pushXPixel / viewportWidth) * 100;   // mutates React state
  obj.y += pushYPixel;
}

// hooks/game-logic/worm-logic.ts — a QUERY, same name
export const applyWormObjectCollision = (worms, objects, context) => {
  return objects.filter((obj) => !collidedObjectIds.has(obj.id));  // removes
};
```

**Target Pattern:**

```ts
// lib/game/collision-detection-worm.ts
export function pushObjectsAwayFromWorms(
  worms: WormObject[],
  objects: GameObject[],
  viewportWidth: number,
): GameObject[] {          // pure: returns new array, never mutates
  if (worms.length === 0 || objects.length === 0 || viewportWidth <= 0) return objects;
  // …same maths, but build new objects instead of assigning obj.x / obj.y
}
```

### Refactor [R2]: Motion authority — one owner per property

- **Target Scope:** `src/lib/accessibility/accessibility-styles.css`, `src/lib/accessibility/accessibility-manager.ts:125`
- **Engineering ROI:** Restores 6 distinct timings (25/90/140/300/720 ms) that were all computing as 1s; makes every `duration-*` class in the repo truthful again. **Applied.**

**Current Pattern:**

```css
* {
  animation-duration: calc(var(--animation-speed, 1) * 1s) !important;
  transition-duration: calc(var(--animation-speed, 1) * 0.2s) !important;
}
```

**Target Pattern:**

```css
html[data-animation-speed] *,
html[data-animation-speed] *::before,
html[data-animation-speed] *::after {
  animation-duration: calc(var(--animation-speed, 1) * 1s) !important;
  transition-duration: calc(var(--animation-speed, 1) * 0.2s) !important;
}
```

```ts
if (this.preferences.animationSpeed !== 1) {
  root.dataset.animationSpeed = String(this.preferences.animationSpeed);
} else {
  delete root.dataset.animationSpeed;
}
```

### Refactor [R3]: Background parallax without a layout transform

- **Target Scope:** `src/styles/backgrounds/real-utilities.css:6-18`
- **Engineering ROI:** Eliminates 7–47px unreported horizontal overflow and 2 full-text re-rasterisations per 20s cycle; keeps the parallax. **Applied.**

**Current Pattern:**

```css
.app-bg-animated { animation: gentle-zoom 20s ease-in-out infinite alternate; }
@keyframes gentle-zoom { 0% { transform: scale(1); } 100% { transform: scale(1.05); } }
```

**Target Pattern:**

```css
.app-bg-animated { animation: none; }

.app-bg-animated::before {
  content: ""; position: absolute; inset: -4%; z-index: -1;
  pointer-events: none; background: inherit;
  background-size: cover; background-position: center;
  transform-origin: center;
  animation: gentle-zoom 20s ease-in-out infinite alternate;
}
```

## 5. Phased Execution Roadmap & Scoped Agent Prompts

1. **Phase 1 — Containment & Safety Lock (P0/P1)** — *complete.* Motion authority + background-box overflow fixed and proven by re-measured runtime probes; regression test landed.
2. **Phase 2 — Frame-Budget, Concurrency & State Hardening (P1/P2)** — *outstanding.* Gate the per-frame `setWorms` dispatch, hoist collision scratch allocations, fix the `useSyncedRef` one-commit lag in the collision pass.
3. **Phase 3 — Structural De-Vibing & Modular Extraction (P2/P3)** — *outstanding.* Delete/rename the duplicate collision command; resolve theme-vs-`dark:` authority; viewport-fit Playwright gate.

### Copy-Paste Surgical Prompts for Coding Agents

> **Prompt [P2-1] (`src/lib/game/collision-detection-worm.ts`):**
> "Strictly scope edits to `src/lib/game/collision-detection-worm.ts`, `src/lib/game/index.ts` and `src/lib/game/collision-detection.ts`. Do not modify any other file. Rename the exported `applyWormObjectCollision` to `pushObjectsAwayFromWorms` and make it pure — return a new `GameObject[]` with pushed positions instead of assigning `obj.x`/`obj.y`. Update both barrel re-exports. Run `npm run test:run && npx tsc -b --noEmit` and confirm green."

> **Prompt [P2-3] (`src/hooks/game-logic/game-effects/animation-loop.ts`):**
> "Strictly scope edits to `src/hooks/game-logic/game-effects/animation-loop.ts` and a new `src/hooks/game-logic/__tests__/animation-loop.test.ts`. Do not modify any other file. Gate the `setWorms` dispatch on `worms.length > 0`, and compute the next worm array once into a local so the collision pass uses the *same* positions it just computed rather than the one-commit-stale `wormsRef.current`. Hoist the collision `Set` and `{ viewportRef }` context to module scope and clear per frame. Add a faked-rAF test asserting the object-update gate produces the same wall-clock advance at 60 Hz and 144 Hz. Run the suite and confirm green."

> **Prompt [P2-2] (`src/context/settings-context.tsx`):**
> "Strictly scope edits to the Tailwind entry stylesheet and `src/components/ui/button.tsx`. Declare `@custom-variant dark (&:where(.dark, .dark *))` so Tailwind's `dark:` utilities follow the app's own `html.<theme>-theme` authority instead of `prefers-color-scheme`. Then audit every `dark:` utility under `src/components` for a surface that now depends on a `.dark` class the app never sets. Verify with `Emulation.setEmulatedMedia` at `prefers-color-scheme: dark` that no `dark:` background leaks into the cream menu panel."

## 6. Remediation Applied (Pass 4.5)

| # | Change | File(s) | Evidence |
| :--- | :--- | :--- | :--- |
| 1 | Motion authority scoped to opt-in | `lib/accessibility/accessibility-styles.css`, `accessibility-manager.ts`, new `__tests__/animation-speed-override.test.ts` | Start button computed `transitionDuration: 0.2s` → **`0.14s`**; entry `animationDuration` **`0.72s`**. Test 4/4 passes; the stylesheet guard was shown to **fail** on the pre-fix CSS. |
| 2 | Background zoom moved off the layout box | `styles/backgrounds/real-utilities.css` | `documentElement.scrollWidth / innerWidth`: **1455/1440 → 1440/1440**. `.app` `animationName: none`, `::before` `gentle-zoom`. |
| 3 | Six-state tactile menu actions + specular edge | `game-menu/game-menu-storybook.css` | Press rule live: `translate3d(0,1px,0) scale(0.988)` at 25 ms, overridden by reduced-motion. |
| 4 | Exit demoted to tertiary | `GameMenuExitDialog.tsx` | 76px full-saturation red → **56px red-50 surface**; contrast **4.83:1 → 7.60:1**; still opens its confirmation dialog. |
| 5 | 44px touch minimum | `GameMenuCreditsDialog.tsx`, `AppGameplayScene.tsx` | Credits **45×20 → 53×44**; Back **118×34 → 118×44**. Sweep reports zero sub-44px controls at 390 and 1440. |
| 6 | Live readouts legible and steady | `TargetDisplay.tsx`, `Stopwatch.tsx` | HUD timer **4.68:1 → 10.02:1**, tabular digits; stopwatch no longer pulses to 50% opacity. |
| 7 | Play-surface legibility scrim | `styles/game-area.css` | Vignette + top band under the objects (`z-index: 0` vs `GAMEPLAY_OBJECTS: 20`). |

**Functional integrity:** `npm run lint` clean · `npm run build` clean · `npx vitest run` **136/136** (132 baseline + 4 new) · `npx tsc -b --noEmit` exit 0. Live gameplay tap verified end-to-end: tapping the target emoji advanced `data-progress` **0 → 5** and rotated the target `grapes → carrot`.

**Preserved contract:** every `data-testid` (`start-game-button`, `exit-button`, `credits-button`, `back-button`, `falling-object`, `target-display`, `progress-bar`, `game-area`, `player-area-1`), every `onClick`/`onTap` handler, and every `aria-*` attribute is untouched. All seven changes are CSS or className-only, except the manager's new `data-animation-speed` attribute.

## 7. Pitfall Log (for the next agent)

- **`preflight_telemetry.py` prunes only `.git`.** Unpatched, it hashes `node_modules` (400+ packages) and appears to hang. Run a scratch copy with a widened skip set and keep it identical between the pre- and post-run so digests stay comparable.
- **`document.querySelectorAll('*')` is the wrong overflow probe.** `overflow:hidden` on the overflowing element clips its own children, so the offender is the *ancestor*, not any descendant. Compare `documentElement.scrollWidth` to `innerWidth` first, then walk ancestors.
- **A transform on the root element is a layout change wearing a compositor costume.** `scale(1.05)` on `.app` re-rasterises all descendant text and grows the layout box; it is not free just because it is a transform.
- **`twMerge` does not merge across variants.** `dark:bg-destructive/60` survives alongside a new `bg-red-50/80`; a light-surface override must repeat itself under `dark:` or the host's OS preference will win.
- **`import.meta.url` is not a `file:` URL under the Vitest jsdom transform.** Read fixtures with `resolve(process.cwd(), …)` instead of `new URL(…, import.meta.url)`.
- **The visual linter's `LAYOUT_THRASHING_ANIMATION` keys on the animation *name*.** `.slide-in-from-top` flagged HIGH while its keyframes animate `translateY` only. Read `theme-inline.css` before "fixing" it.

## 8. Delivery Verification & Standing CI Gap

**Dependency advisories.** GitHub reported 35 on the default branch (2 critical, 12 high). Every critical/high advisory was resolvable **in-range with no semver-major bump**; `npm audit fix` moved 28 transitive packages. Result: **19 → 4 advisories, all LOW**, all from `deepmerge` via `workbox-build`, whose only fix is downgrading `vite-plugin-pwa` to `0.2.1` — a breaking change not worth taking for a prototype-pollution vector in a build-time-only tool.

**Deployed artefact verified, not assumed.** A `200` from `https://english-k1-run.vercel.app` proves nothing on its own, so the check was ordered as the skill requires:

| Gate | Result |
| :--- | :--- |
| Automation actually runs | **NO — `gh api repos/…/actions/permissions` → `enabled: false`.** `ci.yml` is decorative and has never gated a merge. |
| Platform says it is live | Vercel Production deployment `7426696361` for `2a9b688`, status **`success`**. |
| Hash equality | **Mismatch** — local `app-CesLVvq5.js` vs served `app-Bb7q9gp-.js`. Environmental (Vercel resolves its own tree), not a stale deploy. |
| Symbol grep of the served bundle | **All present.** `game-area:after`, `.app-bg-animated::before`, `inset:-4%`, `.app-bg-animated{animation:none}`, `data-animation-speed` in `index-BjMLoHkS.css`; `.menu-action-card.menu-action-card:active` in `app-DojOsofW.css`. |
| Re-measured on production | `scrollWidth === innerWidth === 1440`; start-button `transitionDuration: 0.14s` (was 0.2s forced); zero universal `!important` rules; `.app` `animationName: none`; credits 53×44; exit 56px on a red-50 surface. |

**Standing gap: GitHub Actions is disabled for this repository.** Hash inequality between local and Vercel builds cannot currently be attributed to a specific commit by CI, because no CI ever runs. Nothing in this audit — including `npm run lint`, `npm run build` and 136 passing tests — has ever been enforced by the remote. Enabling Actions is a repository-settings change with billing implications and is deliberately left to the owner.

## 9. Remediation Round 2 — the E2E gate and the code defects

The first delivery pass ran unit tests only and called the change verified. That was the wrong gate: 18 Playwright specs exercise the exact surfaces being restyled (menu viewport fit, touch, contrast, keyboard navigation, reduced motion). They were run in round 2, and **the browser binary Playwright 1.63 wanted (revision 1243) was not in the cache**, so the first attempt failed 14/14 on `browserType.launch`, not on behaviour. After `npx playwright install chromium`:

| Gate | Result |
| :--- | :--- |
| `npx playwright test --project=chromium` | **62 passed, 4 skipped, 0 failed** (3.5 min) — run twice: once for the visual pass, once after the game-loop change |
| `npx vitest run` | **140 passed** (136 + 4 new loop tests) |
| `npx tsc -b --noEmit` · `npm run lint` · `npm run build` | exit 0 · clean · clean |

**Correction to §2, Lens 1.** The duplicate-collision finding was under-reported. `src/lib/game/` was not one bad file among many — it was a **near-entirely dead parallel implementation** of `hooks/game-logic/`:

| File | Status |
| :--- | :--- |
| `worm-manager.ts` | **Dead duplicate** of `worm-logic.ts` — same `createWorms`, `updateWormPosition(s)`, `killWorm`, `removeDeadWorms`, copied wholesale. 5 of 6 exports had zero references. |
| `collision-detection-worm.ts` | Dead; `applyWormObjectCollision` with *opposite* semantics to the live one, mutating React state in place. |
| `index.ts` | Barrel imported by **nobody**, advertising the dead tree as "the game module". |
| `collision-detection.ts` | Barrel; one live re-export. |
| `collision-detection-lanes.ts` | **Alive** — `processLaneCollisions` is used by `object-update.ts`. `partitionByLane` had zero references. |

Four files deleted (~150 LOC), the one live import repointed at `collision-detection-lanes`, and the dead `partitionByLane` export dropped.

**P2-4 fixed and proven.** `animation-loop.ts` now owns an authoritative worm array seeded once from the ref, and collision resolves against the positions that frame just computed. `updateWormPositions` returns the same reference for an empty board, so the dispatch is skipped when nothing moves; the collision context object is hoisted out of the frame callback.

The regression test is decisive rather than decorative: an object is placed so it does **not** overlap the worm at t0 but **does** after one frame of travel. Reverting the loop to the stale read makes it fail — `expected [ { id: 'object-1', … } ] to have a length of +0 but got 1` — and restoring the fix makes it pass. Verified by temporarily reverting the source and re-running.

**Still outstanding (deliberately):** React state remains the game transport (every frame still reconciles the emoji list); the theme-vs-`dark:` authority conflict is systemic and only patched locally on the Exit button; `INEFFECTIVE_DYNAMIC_IMPORT` on the speech synthesizer. These are Phase 2/3 and none is a correctness bug.


