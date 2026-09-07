# English K1 Run Startup Payload Safety Plan


> **Status: DONE (2026-09-07)** — Post-hoc snapshot. All 5 tasks already shipped. See resolution note `plans/archive/2026-09-06-plans-audit-resolution.md` (parallels `plans/` audit). Live-code evidence: `src/test/pwa-welcome-config.test.ts` (Task 1), `src/lib/utils/background-preloader.test.ts` (Task 2), `scripts/check-welcome-build-assets.cjs` (Task 3), `package.json` `verify:welcome-assets` script (Task 4). `vite-pwa-config.ts` already has welcome-sangsom + welcome*.mp3/wav in `includeAssets` and `welcome-media-cache-v1` runtime rule. Plans audit (2026-09-06) covered `plans/` only; this `.github/superpower/plan/` set was missed. Resolution appended in-place so future dispatcher scans short-circuit.

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

## What this plan deliberately does **not** do

- re-encode `New_welcome_video.mp4`
- compress `welcome-sangsom.png`
- replace branded media
- change welcome timing or playback
- touch welcome UI code

Media compression is a separate future plan that requires explicit approval.

## Task index

- [Tasks 1–2](2026-04-03-startup-payload-tasks-1-2.md): PWA config test and background preloader policy
- [Tasks 3–5](2026-04-03-startup-payload-tasks-3-5.md): Build artifact verifier, package script, and regression verification
