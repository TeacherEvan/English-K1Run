# JOBCARD

Repo: TeacherEvan/English-K1Run (default branch: main)
Purpose: Compressed history of work that helps future agents ramp quickly.

## Highlights

- Classroom design alignment: warm, light-first menu and welcome shells, shared brand constants, refreshed manifest/icon metadata, and focused design regressions.
- Competition polish: deterministic welcome start, localized core UI/a11y copy, and unified `English K1 Run` branding.
- Audio pipeline: fallback-chain hardening, inventory validation, fade transitions, overlap guards, and public fallback stability.
- Menu and welcome: layout fixes, lazy-loaded menus, welcome flow stability, intro video-first startup gating, and home-menu audio gating.
- Settings/accessibility: expanded settings coverage, reduced motion/high contrast, and WCAG-aligned UI.
- E2E reliability: Playwright waits, navigation retry backoff, touch spec stability.
- Tooling and docs: Copilot instructions expansion, clarified MCP tooling, build and lint stability.
- Gameplay polish: lighter HUD motion, quieter gameplay audio, and touch-first interaction fixes.

## Timeline (Compressed)

### 2026-04-04

- Removed the startup language chooser immediately after selection so it no longer blocks the school intro video.
- Reworked welcome startup sequencing so the intro video loads first, welcome narration starts from the real video `playing` event, and the large status panel stays hidden during active intro playback.
- Added a deterministic intro playback gate plus unit and Playwright regressions for chooser dismissal, video-first startup, and the `welcome-sangsom.png` fallback-only failure path.
- Validation: `npm --prefer-ipv4 run test:run -- src/components/welcome/__tests__/intro-playback-gate.test.ts src/components/welcome/__tests__/use-welcome-sequence.test.tsx src/components/welcome/__tests__/WelcomeScreen.test.tsx src/components/welcome/__tests__/WelcomeStatusPanel.test.tsx src/components/welcome/__tests__/WelcomeScreen.startup-gate.test.tsx`, `npm --prefer-ipv4 run test:e2e -- e2e/specs/welcome-layout.spec.ts --project=chromium`, and `npm --prefer-ipv4 run verify` passed locally.

### 2026-04-03

- Moved the desktop welcome UI into a compact right-side dock so the hero background/video stays visually dominant, while preserving the centered stacked mobile layout.
- Reduced the welcome scrim intensity to better respect the classroom artwork instead of burying it under a dark overlay.
- Added explicit target-clear progression telemetry with `trackTargetClearProgress`, while keeping `targetsClearedThisLevel` as the gameplay source of truth for default-mode level completion.
- Clarified emoji lifecycle removal reasons so correct-target clears and incorrect removals can be audited separately in tests and telemetry.
- Stabilized the countdown-first transition flow by replacing timing-based Playwright taps with the state-aware `tapCurrentTargetAndWaitForResolution()` helper.
- Added focused regressions for desktop/mobile welcome composition and 10-clear level transitions in `e2e/specs/welcome-layout.spec.ts` and `e2e/specs/level-transition-countdown.spec.ts`.
- Added browser-side audio diagnostics assertions for welcome overlap by reading `window.gameEventTracker` plus `window.__audioDebug`, and backfilled Web Audio success tracking so fade-based welcome playback is auditable in E2E.
- Updated welcome-language, visual welcome, and mobile screenshot Playwright specs to match the current docked welcome UI and reuse the shared page-object flow for more reliable mobile level screenshots.
- Validation: `npm --prefer-ipv4 run test:run -- src/hooks/game-logic/__tests__/tap-handlers-object.test.ts src/hooks/game-logic/__tests__/tap-state-updater.test.ts src/hooks/game-logic/__tests__/inter-level-transition.test.ts src/components/welcome/__tests__/WelcomeStatusPanel.test.tsx`, `PLAYWRIGHT_PROJECTS=chromium,mobile npm --prefer-ipv4 run test:e2e -- e2e/specs/welcome-layout.spec.ts e2e/specs/level-transition-countdown.spec.ts`, `PLAYWRIGHT_PROJECTS=chromium,firefox,mobile npm --prefer-ipv4 run test:e2e -- e2e/specs/gameplay.spec.ts -g "should show level transition after 10 correct taps"`, and `npm --prefer-ipv4 run verify` passed locally.

### 2026-04-02

- Aligned the startup and menu shell to the warm classroom design brief: shared `CLASSROOM_BRAND` constants, OKLCH-tinted theme variables, branded hero/action surfaces, and readable welcome status/language shells.
- Updated player-facing metadata and identity assets so the PWA manifest and icon now reinforce the `English K1 Run` turtle-and-nature branding.
- Added focused regression coverage for the classroom surfaces with `classroom-brand` and metadata unit tests plus Playwright checks for menu and welcome viewport/readability behavior.
- Tightened startup/runtime polish with safer background preloading, gameplay audio-key prefetching at session start, and improved speech playback language/timeout handling.
- Expanded gameplay localization coverage so non-Thai gameplay HUD/completion text now respects `gameplayLanguage`, with localized target labels and richer French/Japanese/Mandarin/Cantonese sentence coverage.
- Reworked Thai welcome playback to match gameplay voice behavior: skip the incorrect prerecorded male Thai clip, prefer native Thai speech, surface a visible silent-fallback diagnostic, and harden the ElevenLabs tooling with Thai-specific voice inspection/regeneration commands.
- Validation: `npm run verify`, `npm run test:run`, and `PLAYWRIGHT_PROJECTS=chromium,mobile npm run test:e2e -- e2e/specs/menu-design.spec.ts e2e/specs/welcome-design.spec.ts` passed locally.

### 2026-03-16

- Spring-cleaned the documentation set so the trusted entry points are now `README.md`, `AUDIO_SETUP.md`, `jobcard.md`, `DOCS/A-README.md`, and `DOCS/CODEBASE_INDEX.md`.
- Removed redundant root-level status summaries and stale roadmap-style TODO docs that had drifted from the current codebase.
- Tightened codebase navigation docs with clearer system maps, directory roles, and guidance on generated artifacts vs source files.
- Updated stale doc references in legacy guidance to point at current maintained docs instead of deleted or nonexistent files.
- Validation: `npm run lint`, `npm run build`, and `npm run test:run` all pass locally.

### 2026-03-10

- Approved implementation after roadmap phase and executed the first single-player competition-polish slice.
- Changed worm gameplay collisions so only contacted falling targets disappear; non-colliding raining targets continue normally.
- Tightened `TargetDisplay` motion and styling: removed pulse-heavy behavior, kept the HUD compact, and reduced countdown-bar motion.
- Removed positive reinforcement gameplay audio; only target-description sentences should speak during play, with incorrect taps kept as lightweight SFX.
- Added gameplay-audio tracking hooks around target announcements to help audit overlap and confirm only the target sentence is triggered.
- Removed non-deterministic welcome auto-start paths; narration now begins from explicit user action in normal mode and from the E2E bypass path when `?e2e=1` is present.
- Localized core visible UI and accessibility announcements: menu title/actions, target display labels, victory copy, gameplay ARIA labels, and level-select screen-reader announcements.
- Unified the public-facing brand string to `English K1 Run` in runtime UI, locale files, and the menu title Playwright assertion.
- Updated roadmap/docs/instructions to reflect the implementation slice and current verification blocker.
- Validation: workspace diagnostics clean for touched files; full terminal verification remains blocked when `node_modules/` is unavailable.

### 2026-02-13

- Disabled gameplay tap reinforcement audio (removed correct/incorrect tap sound playback).
- Enforced instruction-first gameplay audio: target-identification announcements remain the only gameplay voice output.
- Added mission completion marker (`sessionStorage`) when non-continuous mode reaches winner state.
- Reworked home menu audio hook to disable association lines and play only "GIVE THEM A STICKER!" after returning from mission completion.
- Added shared mission-complete audio state helper: `src/hooks/home-menu-audio-state.ts`.
- Validation: changed files pass ESLint (`ESLINT_EXIT:0`) and error scan (no TypeScript/diagnostic errors in touched files).

### 2026-02-08

- Added audio fade-in/out support and applied it to welcome-to-menu and home menu sequences.
- Expanded Settings dialog into Audio, Visual, Controls, and Accessibility tabs.
- Fixed welcome readiness state for audio sequencing and guarded SSR usage in audio context.
- Split welcome audio sequencer into smaller modules to satisfy the 200-line limit.
- Fixed public sounds URL resolution to select existing formats (prevents .ogg/.m4a/.aac 404 loops).
- Stopped ElevenLabs/WebSpeech playback when stopping all audio to prevent overlap across screens.
- Disabled speech fallback for normal SFX playback to avoid incorrect or stacked audio.
- Simplified audio-public-resolver to eliminate network check spam (returns .mp3/.wav directly).
- Next: broader visual/a11y regression sweep after the classroom shell changes settle.

### 2026-02-03

- Home menu Sangsom association lines now play only once per session.

### 2026-02-02

- Generated missing welcome audio and validated inventory (`npm run audio:validate`).
- Restored /sounds public fallback resolution for missing assets.
- Disabled repeated target spawn audio.

### 2026-01-17

- Copilot instructions expanded for production guidance (error handling, perf, a11y, testing, security, deployment).
- MCP tooling docs clarified editor-managed tool availability vs repo metadata.
- GameMenu lazy-loaded and `formatBestTime` utility extracted.
- Playwright navigation retry improved with backoff + jitter; touch spec beforeEach hardened.
- GameMenuLevelSelect improved fallbacks, a11y, and selection stability.
- Audio bundle reduced by removing redundant WAVs in favor of MP3.
- HomeWindow and accessibility utilities refactored.

### 2026-01-16 to 2026-01-13

- E2E stability: updated waits for lazy-loaded menus and fixed skeleton IDs.
- Welcome screen: layout fixes and logic cleanup to avoid landscape cropping.
- ElevenLabs fallback chain and Playwright diagnostic fixes.

### 2025-12-29 to 2025-12-22

- CSS warnings removed (vendor prefix fixes).
- Welcome fallback copy, debug overlay keyboard shortcut, and cleanup.
- Continuous mode: timer, high score tracking, and progression tuning.
- Audio pacing and i18n visuals (Thai font stack, rainbow/gradient effects).
- Touch performance improvements; TypeScript SDK pin and ESLint adjustments.

## Common Files Impacted

- Audio: src/lib/audio/_, src/lib/sound-manager_, public/sounds/\*
- Menu/UI: src/components/game-menu/_, src/components/WelcomeScreen_
- Gameplay flow: src/hooks/game-logic/\_, src/lib/event-tracker/event-tracker.ts
- Settings: src/context/settings-context.tsx, src/components/ui/\*
- E2E: e2e/fixtures/_, e2e/specs/_, improved-testServer.js
- Tooling/docs: .github/copilot-instructions.md, eslint.config.js, .vscode/settings.json

## Validation

- `npm --prefer-ipv4 run verify` (2026-04-03) passed.
- `PLAYWRIGHT_PROJECTS=chromium,firefox,mobile npm --prefer-ipv4 run test:e2e -- e2e/specs/gameplay.spec.ts -g "should show level transition after 10 correct taps"` (2026-04-03) passed.
- `npm run audio:validate` (2026-02-02) passed.
- `npm run test:run`, `npm run check-types`, `npm run verify` (Dec 2025) passed.

## Notes

- Gameplay voice output should stay instruction-first: target-description sentences are the only intended spoken gameplay audio.
- `centralAudioManager` and `eventTracker` are the preferred coordination points for overlap prevention and playback auditing.
- `trackTargetClearProgress` is telemetry only; default-mode progression must continue to derive from `targetsClearedThisLevel` inside `useGameLogic`.
- Worms are distractors that cull only the targets they physically touch; collision updates should preserve all other falling targets.
- Keep gameplay HUD overlays visually light and nonblocking; center-top target guidance is acceptable only when pointer-safe.

## Recommendations

- Before the next welcome/gameplay polish pass, rerun `npm --prefer-ipv4 run verify` plus the focused Playwright matrix for `welcome-layout`, `level-transition-countdown`, and the 10-clear gameplay transition case.
- Add automated assertions for audio-overlap tracker events once the browser test harness can inspect `eventTracker`/audio diagnostics reliably.
- Keep routing new long-lived guidance into `README.md`, `AUDIO_SETUP.md`, `jobcard.md`, or the `DOCS/` index files instead of adding one-off root summaries.

## Follow-ups

- Broaden the Playwright matrix again before merge if welcome layout, countdown flow, or moving-target interactions change.
- Explore a safe E2E hook for reading audio-overlap diagnostics without coupling gameplay to telemetry internals.
- Continue legacy documentation and inactive UI branding cleanup.
- Run the broader menu/accessibility Playwright matrix before merge if the branch picks up more UI changes.
- Extend audio fades to other transitions when needed.
- Continue E2E stabilization after major UI updates.
