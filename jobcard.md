# JOBCARD

Repo: TeacherEvan/English-K1Run (branch: main)
Purpose: Compressed history of work that helps future agents ramp quickly.

## Highlights

- Competition polish: deterministic welcome start, localized core UI/a11y copy, and unified `English K1 Run` branding.
- Audio pipeline: fallback-chain hardening, inventory validation, fade transitions, overlap guards, and public fallback stability.
- Menu and welcome: layout fixes, lazy-loaded menus, welcome flow stability, and home-menu audio gating.
- Settings/accessibility: expanded settings coverage, reduced motion/high contrast, and WCAG-aligned UI.
- E2E reliability: Playwright waits, navigation retry backoff, touch spec stability.
- Tooling and docs: Copilot instructions expansion, clarified MCP tooling, build and lint stability.
- Gameplay polish: lighter HUD motion, quieter gameplay audio, and touch-first interaction fixes.

## Timeline (Compressed)

### 2026-03-10

- Approved implementation after roadmap phase and executed the first single-player competition-polish slice.
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
- Next: home screen visual refactor.

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
- Settings: src/context/settings-context.tsx, src/components/ui/\*
- E2E: e2e/fixtures/_, e2e/specs/_, improved-testServer.js
- Tooling/docs: .github/copilot-instructions.md, eslint.config.js, .vscode/settings.json

## Validation

- `npm run audio:validate` (2026-02-02) passed.
- `npm run test:run`, `npm run check-types`, `npm run verify` (Dec 2025) passed.

## Notes

- Gameplay voice output should stay instruction-first: target-description sentences are the only intended spoken gameplay audio.
- `centralAudioManager` and `eventTracker` are the preferred coordination points for overlap prevention and playback auditing.
- Keep gameplay HUD overlays visually light and nonblocking; center-top target guidance is acceptable only when pointer-safe.

## Recommendations

- Reinstall dependencies and rerun `npm run verify` plus the local Playwright matrix before the next polish pass.
- Add automated assertions for audio-overlap tracker events once the browser test harness can inspect them reliably.
- Continue pruning stale historical docs so `README.md`, `AUDIO_SETUP.md`, and `jobcard.md` stay the fastest onboarding path.

## Follow-ups

- Install dependencies and rerun lint/build/Playwright verification.
- Continue legacy documentation and inactive UI branding cleanup.
- Home screen visual refactor (next session).
- Extend audio fades to other transitions when needed.
- Continue E2E stabilization after major UI updates.
